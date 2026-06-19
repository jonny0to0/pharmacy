import express, {} from "express";
import prisma from "../../db.js";
import { authenticateToken, authorizeRoles, sensitiveActionsLimiter } from "../../middleware/auth.js";
import { createAuditLog } from "../../services/auditService.js";
import { AlertingService } from "../../services/AlertingService.js";
const router = express.Router();
router.use(authenticateToken);
router.use(authorizeRoles("SUPER_ADMIN"));
/**
 * Perform a "God Mode" Tenant Reset (Wipe)
 * Risk Level: CRITICAL
 * Requirements: Password + OTP verified (handled by frontend flow)
 */
router.post("/tenant/:tenantId/reset", sensitiveActionsLimiter, async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { reason, challengeToken } = req.body;
        if (!reason || reason.length < 10) {
            return res.status(400).json({ error: "A detailed justification (min 10 chars) is mandatory for this action." });
        }
        if (!challengeToken) {
            return res.status(403).json({ error: "Security challenge token missing. Password + OTP verification required." });
        }
        // 1. Verify Tenant
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant)
            return res.status(404).json({ error: "Target business not found." });
        // 2. Execute Wipe (Atomic transaction)
        // For this example, we clear inventory and sales, but keep the core business profile
        const counts = await prisma.$transaction([
            prisma.product.deleteMany({ where: { tenantId } }),
            prisma.saleinvoice.deleteMany({ where: { tenantId } }),
            prisma.purchasebill.deleteMany({ where: { tenantId } }),
            prisma.tenant.update({
                where: { id: tenantId },
                data: { isSetupCompleted: false }
            })
        ]);
        // 3. ENHANCED Audit Log (Action Tagging + God Mode Metadata)
        await createAuditLog(req.user.userId, "GOD_MODE", "TENANT_WIPE", tenantId, {
            reason,
            affectedTenant: tenant.businessName,
            riskLevel: "CRITICAL",
            clearedRecords: counts.length
        }, "CRITICAL", req.ip, req.user?.isImpersonating ? req.user.originalAdminId : undefined);
        // 4. Alerting (Pluggable)
        await AlertingService.notify(`🚨 [CRITICAL] God Mode Override: Tenant "${tenant.businessName}" was wiped by admin ${req.user.userId}. Reason: ${reason}`, "CRITICAL");
        res.json({
            success: true,
            message: "Tenant reset complete. Business has been reverted to onboarding state.",
            data: { cleared: counts.length }
        });
    }
    catch (error) {
        console.error("[GodMode] Wipe Error:", error);
        res.status(500).json({ error: "Failed to execute global override." });
    }
});
/**
 * Perform a "God Mode" Tenant Suspension
 * Risk Level: HIGH
 */
router.post("/tenant/:tenantId/suspend", sensitiveActionsLimiter, async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { reason, lockReason, challengeToken } = req.body;
        if (!reason || !lockReason) {
            return res.status(400).json({ error: "Audit reason and Lock reason are mandatory." });
        }
        if (!challengeToken) {
            return res.status(403).json({ error: "Security challenge verification required." });
        }
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscription: true }
        });
        if (!tenant)
            return res.status(404).json({ error: "Target business not found." });
        // Execute state change
        await prisma.$transaction([
            prisma.subscription.updateMany({
                where: { tenantId, status: { notIn: ['SUSPENDED', 'ARCHIVED'] } },
                data: { status: 'SUSPENDED' }
            }),
            prisma.tenant.update({
                where: { id: tenantId },
                data: { updatedAt: new Date() } // Trigger for cache invalidation
            })
        ]);
        // Audit with Action Tagging
        await createAuditLog(req.user.userId, "GOD_MODE", "TENANT_SUSPEND", tenantId, {
            reason,
            lockReason,
            affectedTenant: tenant.businessName,
            actionType: "SECURITY_BLOCK"
        }, "WARNING", req.ip, req.user?.isImpersonating ? req.user.originalAdminId : undefined);
        await AlertingService.notify(`⚠️ [SECURITY] Tenant "${tenant.businessName}" suspended by admin. Reason: ${lockReason}`, "WARNING", `SUSPEND_${tenantId}`);
        res.json({ success: true, message: "Tenant access has been restricted." });
    }
    catch (error) {
        console.error("[GodMode] Suspension Error:", error);
        res.status(500).json({ error: "Failed to restrict tenant access." });
    }
});
export default router;
//# sourceMappingURL=godmode.js.map