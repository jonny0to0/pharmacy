import express, {} from "express";
import prisma from "../../db.js";
import jwt from "jsonwebtoken";
import { sendSuccess } from "../../utils/response.js";
import { authenticateToken, authorizeRoles, sensitiveActionsLimiter } from "../../middleware/auth.js";
import { createAuditLog } from "../../services/auditService.js";
const router = express.Router();
router.use(authenticateToken);
router.use(authorizeRoles("SUPER_ADMIN"));
/**
 * Initiate Impersonation
 * Generates a short-lived token to access a specific tenant's data
 */
router.post("/:tenantId", sensitiveActionsLimiter, async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ success: false, error: "A valid reason is mandatory for impersonation logs." });
        }
        // 1. Verify Tenant and User exist
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant)
            return res.status(404).json({ success: false, error: "Tenant not found." });
        const targetUser = await prisma.user.findFirst({
            where: { tenantId, userrole: { some: { role: { name: "BUSINESS_ADMIN" } } } }
        });
        // 🔒 Security Guardrail: Never allow impersonating another Super Admin
        const isTargetSuperAdmin = await prisma.userrole.findFirst({
            where: {
                user: { tenantId },
                role: { name: "SUPER_ADMIN" }
            }
        });
        if (isTargetSuperAdmin) {
            return res.status(403).json({ success: false, error: "Security Violation: Impersonating a Super Admin is forbidden." });
        }
        // 2. Generate Impersonation Token
        const secret = process.env.JWT_SECRET || "default_secret";
        const impersonationToken = jwt.sign({
            userId: req.user.userId,
            roles: ["BUSINESS_ADMIN"], // Elevate to Admin of that tenant
            tenantId: tenant.id,
            isImpersonating: true,
            originalAdminId: req.user.userId
        }, secret, { expiresIn: '30m' } // Short duration for safety
        );
        // 3. Audit Log (Critical Action)
        await createAuditLog(req.user.userId, "SYSTEM", "IMPERSONATION_START", tenantId, { reason, targetBusiness: tenant.businessName }, "CRITICAL", req.ip);
        return sendSuccess(res, { token: impersonationToken }, `Support mode activated for ${tenant.businessName}`);
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Failed to initiate impersonation flow." });
    }
});
/**
 * Stop Impersonation
 * Formally logs the exit from a tenant's context
 */
router.post("/stop", sensitiveActionsLimiter, async (req, res) => {
    try {
        // Audit Log the exit
        await createAuditLog(req.user.userId, "SYSTEM", "IMPERSONATION_STOP", req.user.tenantId || undefined, { message: "Administrative session terminated normally" }, "WARNING", // Elevated log level per production decision
        req.ip);
        return sendSuccess(res, null, "Administrative identity restored successfully");
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Log exit failed" });
    }
});
export default router;
//# sourceMappingURL=impersonate.js.map