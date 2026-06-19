import prisma from "./src/db.js";
import bcrypt from "bcryptjs";
import { SubscriptionService } from "./src/services/SubscriptionService.js";
import jwt from "jsonwebtoken";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const generateTokens = (user) => {
    const accessToken = jwt.sign({ userId: user.id, roles: user.roles, tenantId: user.tenantId }, process.env.JWT_SECRET || "default_secret", { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || "default_refresh_secret", { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { accessToken, refreshToken };
};
async function main() {
    const name = "Test User Script";
    const email = "script_test@example.com";
    const mobile = "1234567890";
    const password = "Password123!";
    const businessName = "Script Business";
    console.log("🚀 Starting Registration Script Test...");
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const result = await prisma.$transaction(async (tx) => {
            console.log("1. Creating Tenant...");
            const tenant = await tx.tenant.create({
                data: { businessName, isSetupCompleted: false },
            });
            console.log("2. Creating TenantSettings...");
            await tx.tenantsettings.create({ data: { tenantId: tenant.id } });
            console.log("3. Creating User...");
            const newUser = await tx.user.create({
                data: { name, email, mobile, password: hashedPassword, role: "BUSINESS_ADMIN", status: "ACTIVE", tenantId: tenant.id }
            });
            console.log("4. Finding Business Admin Role...");
            const businessAdminRole = await tx.role.findFirst({
                where: { name: 'BUSINESS_ADMIN', tenantId: null }
            });
            if (businessAdminRole) {
                console.log("5. Assigning Role...");
                await tx.userrole.create({
                    data: { userId: newUser.id, roleId: businessAdminRole.id }
                });
            }
            console.log("6. Creating Subscription...");
            await SubscriptionService.createSubscription(tenant.id, "FREE", "MONTHLY", { performedBy: newUser.id });
            console.log("7. Creating NotificationPreference...");
            await tx.notificationpreference.create({
                data: { userId: newUser.id, email: true, inApp: true, lowStock: true, newOrder: true }
            });
            return { user: newUser, tenant, roles: [businessAdminRole?.name || 'BUSINESS_ADMIN'] };
        });
        console.log("✅ Transaction Success. Generating Tokens...");
        const { accessToken, refreshToken } = generateTokens({
            id: result.user.id,
            roles: result.roles,
            tenantId: result.user.tenantId
        });
        console.log("8. Creating Session...");
        await prisma.session.upsert({
            where: { userId_userAgent_ip: { userId: result.user.id, userAgent: 'test-agent', ip: '127.0.0.1' } },
            update: { token: refreshToken },
            create: {
                userId: result.user.id,
                token: refreshToken,
                userAgent: 'test-agent',
                ip: '127.0.0.1',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        console.log("🎉 Registration Successful!");
        console.log("User ID:", result.user.id);
    }
    catch (error) {
        console.error("❌ Registration Failed:", error);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test-register.js.map