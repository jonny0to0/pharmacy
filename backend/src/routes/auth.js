import express, {} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma, { basePrisma } from "../db.js";
import { randomUUID } from "crypto";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/schemas.js";
import { SecurityService } from "../services/SecurityService.js";
import { SubscriptionService } from "../services/SubscriptionService.js";
import { cacheService } from "../services/cache.service.js";
const router = express.Router();
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
const generateTokens = (user) => {
    const accessToken = jwt.sign({ userId: user.id, roles: user.roles, tenantId: user.tenantId }, process.env.JWT_SECRET || "default_secret", { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || "default_refresh_secret", { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { accessToken, refreshToken };
};
const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};
router.post("/register", validate(registerSchema), async (req, res) => {
    try {
        const { name, email, mobile, password, businessName } = req.body;
        // Check if user exists
        const existingUser = await basePrisma.user.findFirst({
            where: { OR: [{ email }, { mobile }] }
        });
        if (existingUser) {
            return res.status(400).json({ error: "User with this email or mobile already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const result = await basePrisma.$transaction(async (tx) => {
            // Create Tenant
            const tenantId = randomUUID();
            const tenant = await tx.tenant.create({
                data: { id: tenantId, businessName, isSetupCompleted: false, updatedAt: new Date() },
            });
            // Initialize Tenant Settings
            await tx.tenantsettings.create({ data: { id: randomUUID(), tenantId: tenant.id } });
            // Create User
            const userId = randomUUID();
            const newUser = await tx.user.create({
                data: { id: userId, name, email, mobile, password: hashedPassword, role: "BUSINESS_ADMIN", status: "ACTIVE", tenantId: tenant.id, updatedAt: new Date() }
            });
            // Assign Default BUSINESS_ADMIN Role
            const businessAdminRole = await tx.role.findFirst({
                where: { name: 'BUSINESS_ADMIN', tenantId: null }
            });
            if (businessAdminRole) {
                await tx.userrole.create({
                    data: { id: randomUUID(), userId: newUser.id, roleId: businessAdminRole.id }
                });
            }
            // Create Initial Subscription (FREE) - Hardened with shared transaction
            await SubscriptionService.createSubscription(tenant.id, "FREE", "MONTHLY", {
                performedBy: newUser.id,
                tx
            });
            // Initialize Notification Preferences
            await tx.notificationpreference.create({
                data: { id: randomUUID(), userId: newUser.id, email: true, inApp: true, lowStock: true, newOrder: true }
            });
            return { user: newUser, tenant, roles: [businessAdminRole?.name || 'BUSINESS_ADMIN'] };
        });
        const { accessToken, refreshToken } = generateTokens({
            id: result.user.id,
            roles: result.roles,
            tenantId: result.user.tenantId
        });
        // Save/Update Session in DB
        await basePrisma.session.upsert({
            where: { userId_userAgent_ip: { userId: result.user.id, userAgent: req.headers['user-agent'] || '', ip: req.ip || '' } },
            update: { token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            create: {
                id: randomUUID(),
                userId: result.user.id,
                token: refreshToken,
                userAgent: req.headers['user-agent'],
                ip: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        setRefreshTokenCookie(res, refreshToken);
        res.status(201).json({
            message: "User registered successfully",
            accessToken,
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                mobile: result.user.mobile,
                businessName: result.tenant.businessName,
                roles: result.roles,
                tenantId: result.user.tenantId,
                isSetupCompleted: result.tenant.isSetupCompleted,
                businessType: result.tenant.businessType,
                permissions: (await basePrisma.role.findFirst({
                    where: { name: 'BUSINESS_ADMIN', tenantId: null },
                    include: { rolepermission: { include: { permission: true } } }
                }))?.rolepermission.map(p => p.permission.name) || [],
                restrictedMenuBehavior: 'HIDE'
            }
        });
    }
    catch (error) {
        console.error("REGISTER_CRITICAL_ERROR:", error);
        // Handle Prisma Specific Errors (Fail-Fast)
        if (error.code === 'P2002') {
            const target = error.meta?.target || '';
            if (target.includes('email')) {
                return res.status(409).json({ success: false, error: "This email address is already registered.", errorCode: "USER_EXISTS" });
            }
            if (target.includes('mobile')) {
                return res.status(409).json({ success: false, error: "This mobile number is already registered.", errorCode: "USER_EXISTS" });
            }
            return res.status(409).json({ success: false, error: "A user with these details already exists.", errorCode: "CONFLICT" });
        }
        if (error.code === 'P2003') {
            return res.status(500).json({ success: false, error: "Data integrity failure. Please contact support.", errorCode: "INTEGRITY_ERROR" });
        }
        res.status(500).json({
            success: false,
            error: "We encountered an error while creating your account. Please try again in a moment.",
            errorCode: "INTERNAL_ERROR"
        });
    }
});
router.post("/login", validate(loginSchema), async (req, res) => {
    try {
        const { email, mobile, password } = req.body;
        const identifier = email || mobile || "unknown";
        const ip = req.ip || "0.0.0.0";
        // 1. Lockout Check
        const lockout = SecurityService.isLockedOut(identifier, ip);
        if (lockout.locked) {
            return res.status(429).json({
                success: false,
                error: `Account temporary locked due to multiple failures. Try again at ${lockout.expiry?.toLocaleTimeString()}`
            });
        }
        const user = await basePrisma.user.findFirst({
            where: { OR: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])] },
            include: {
                tenant: {
                    include: {
                        tenantsettings: true
                    }
                },
                userrole: { include: { role: { include: { rolepermission: { include: { permission: true } } } } } }
            }
        });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            await SecurityService.recordFailedAttempt(identifier, ip);
            return res.status(400).json({ success: false, error: "Invalid credentials" });
        }
        // 2. Success - Reset Attempts
        SecurityService.resetAttempts(identifier, ip);
        if (user.isInvited && user.status === "PENDING") {
            return res.status(403).json({ error: "Please check your email and complete your account setup before signing in." });
        }
        if (user.status === "DISABLED") {
            return res.status(403).json({ error: "Login failed. Please contact system administrator." });
        }
        // Strict Guard: Ensure roles structure is correct
        if (!user.userrole || !Array.isArray(user.userrole)) {
            console.error(`[Auth] Structural Error: Missing or invalid userrole for user ${user.id}`);
            throw new Error("Invalid roles structure in authentication");
        }
        const roles = user.userrole.map(ur => ur.role.name);
        // Strict Guard: Ensure all roles have permission objects
        if (user.userrole.some(ur => !ur.role.rolepermission)) {
            console.error(`[Auth] Data Integrity Error: Missing rolepermission for user ${user.id}`);
            throw new Error("Security data integrity violation: Missing role permissions");
        }
        const { accessToken, refreshToken } = generateTokens({
            id: user.id,
            roles,
            tenantId: user.tenantId
        });
        // Update session in DB (Token Rotation)
        await basePrisma.session.upsert({
            where: { userId_userAgent_ip: { userId: user.id, userAgent: req.headers['user-agent'] || '', ip: req.ip || '' } },
            update: { token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            create: {
                id: randomUUID(),
                userId: user.id,
                token: refreshToken,
                userAgent: req.headers['user-agent'],
                ip: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        setRefreshTokenCookie(res, refreshToken);
        const permissions = [...new Set(user.userrole.flatMap(ur => ur.role.rolepermission.map(rp => rp.permission.name)))];
        const isSuperAdmin = user.userrole.some(ur => ur.role.name === "SUPER_ADMIN");
        const isSetupCompleted = isSuperAdmin ? true : (user.tenant?.isSetupCompleted || false);
        res.json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                businessName: user.tenant?.businessName || null,
                roles: user.userrole.map(ur => ur.role.name),
                tenantId: user.tenantId,
                isSetupCompleted,
                businessType: user.tenant?.businessType || null,
                permissions,
                restrictedMenuBehavior: user.tenant?.tenantsettings?.restrictedMenuBehavior || 'HIDE'
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/setup-password", async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: "Token and password are required" });
        }
        const user = await basePrisma.user.findFirst({
            where: {
                inviteToken: token,
                inviteTokenExpires: { gte: new Date() },
                status: "PENDING"
            }
        });
        if (!user) {
            return res.status(400).json({ error: "Invalid or expired invitation token" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await basePrisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                status: "ACTIVE",
                inviteToken: null,
                inviteTokenExpires: null,
                isActive: true
            }
        });
        res.json({ message: "Password setup successfully. You can now login." });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to setup password" });
    }
});
router.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken)
        return res.status(401).json({ error: "No refresh token" });
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "default_refresh_secret");
        // Check DB for matching session (Rotation check)
        const session = await basePrisma.session.findFirst({
            where: { token: refreshToken, userId: decoded.userId }
        });
        if (!session) {
            // If refresh token is reused/not in DB, someone might be attacking.
            // Revoke all sessions for this user for security.
            await basePrisma.session.deleteMany({ where: { userId: decoded.userId } });
            res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
            return res.status(401).json({ error: "Session revoked" });
        }
        const user = await basePrisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                tenant: {
                    include: {
                        tenantsettings: true
                    }
                },
                userrole: { include: { role: { include: { rolepermission: { include: { permission: true } } } } } }
            }
        });
        if (!user) {
            console.warn(`Refresh failed: User ${decoded.userId} not found`);
            return res.status(401).json({ error: "User not found" });
        }
        console.log(`Refreshing session for user: ${user.email} (Role: ${user.userrole.map(r => r.role.name).join(', ')})`);
        // Strict Guard: Ensure roles structure is correct
        if (!user.userrole || !Array.isArray(user.userrole)) {
            console.error(`[AuthRefresh] Structural Error: Invalid userrole for user ${user.id}`);
            throw new Error("Invalid session structure");
        }
        const roles = user.userrole.map(ur => ur.role.name);
        // Strict Guard: Ensure permissions are available
        if (user.userrole.some(ur => !ur.role.rolepermission)) {
            console.error(`[AuthRefresh] Data Integrity Error: Missing permissions for user ${user.id}`);
            throw new Error("Session integrity violated: Permissions missing");
        }
        // ROTATION: Generate new tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens({
            id: user.id,
            roles,
            tenantId: user.tenantId
        });
        // Update DB with NEW refresh token
        await basePrisma.session.update({
            where: { id: session.id },
            data: { token: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        });
        setRefreshTokenCookie(res, newRefreshToken);
        const permissions = [...new Set(user.userrole.flatMap(ur => ur.role.rolepermission.map(rp => rp.permission.name)))];
        const isSuperAdmin = user.userrole.some(ur => ur.role.name === "SUPER_ADMIN");
        const isSetupCompleted = isSuperAdmin ? true : (user.tenant?.isSetupCompleted || false);
        res.json({
            accessToken: newAccessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                businessName: user.tenant?.businessName || null,
                roles: user.userrole.map(ur => ur.role.name),
                tenantId: user.tenantId,
                isSetupCompleted,
                businessType: user.tenant?.businessType || null,
                permissions,
                restrictedMenuBehavior: user.tenant?.tenantsettings?.restrictedMenuBehavior || 'HIDE'
            }
        });
    }
    catch (err) {
        res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
        return res.status(401).json({ error: "Invalid refresh token" });
    }
});
router.post("/logout", async (req, res) => {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
    let userId = null;
    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "default_refresh_secret");
            userId = decoded.userId;
            await basePrisma.session.deleteMany({ where: { token: refreshToken } });
        }
        catch (err) {
            // Ignore
        }
    }
    if (!userId) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.userId) {
                    userId = decoded.userId;
                }
            }
            catch (err) {
                // Ignore
            }
        }
    }
    if (userId) {
        await cacheService.delete(`user_perms:${userId}`);
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
    res.json({ message: "Logged out successfully" });
});
export default router;
//# sourceMappingURL=auth.js.map