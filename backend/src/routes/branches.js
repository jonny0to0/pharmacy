import express, {} from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { createAuditLog } from "../services/auditService.js";
import { randomUUID } from "crypto";
const router = express.Router();
// Get all branches for the current tenant
router.get("/", authenticateToken, requirePermission("SETTINGS_BUSINESS.READ"), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId)
            return res.status(400).json({ error: "Tenant ID required" });
        const branches = await prisma.branch.findMany({
            where: { tenantId },
            orderBy: { createdAt: "asc" }
        });
        res.json(branches);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch branches" });
    }
});
// Create a new branch
router.post("/", authenticateToken, requirePermission("SETTINGS_BUSINESS.CREATE"), async (req, res) => {
    try {
        const { name } = req.body;
        const tenantId = req.user.tenantId;
        if (!tenantId)
            return res.status(400).json({ error: "Tenant ID required" });
        if (!name)
            return res.status(400).json({ error: "Branch name is required" });
        const branch = await prisma.branch.create({
            data: {
                id: randomUUID(),
                name,
                tenantId
            }
        });
        // Audit Log
        await createAuditLog(req.user.userId, "SETTINGS_BUSINESS", "CREATE_BRANCH", branch.id, {
            name: branch.name,
            tenantId
        });
        res.status(201).json(branch);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create branch" });
    }
});
// Delete a branch
router.delete("/:id", authenticateToken, requirePermission("SETTINGS_BUSINESS.DELETE"), async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;
        if (!tenantId)
            return res.status(400).json({ error: "Tenant ID required" });
        const branch = await prisma.branch.findFirst({
            where: { id, tenantId }
        });
        if (!branch)
            return res.status(404).json({ error: "Branch not found" });
        await prisma.branch.delete({
            where: { id }
        });
        // Audit Log
        await createAuditLog(req.user.userId, "SETTINGS_BUSINESS", "DELETE_BRANCH", id, {
            name: branch.name,
            tenantId
        });
        res.json({ message: "Branch deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete branch" });
    }
});
export default router;
//# sourceMappingURL=branches.js.map