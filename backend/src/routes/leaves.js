import express, {} from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { auditLog } from "../middleware/audit.middleware.js";
import { randomUUID } from "crypto";
const router = express.Router();
// Get Leaves
router.get("/", authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const userId = req.user.userId;
        const { status, staffId } = req.query;
        const isAdmin = req.user.roles.includes("BUSINESS_ADMIN") || req.user.roles.includes("SUPER_ADMIN");
        const isManager = req.user.roles.includes("MANAGER");
        let whereClause = { tenantId };
        if (!isAdmin && !isManager) {
            whereClause.userId = userId;
        }
        else if (staffId) {
            whereClause.userId = staffId;
        }
        if (status) {
            whereClause.status = status;
        }
        const leaves = await prisma.leaverequest.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true, employeeId: true } },
                approver: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leaves);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch leave requests" });
    }
});
// Request Leave
router.post("/request", authenticateToken, auditLog("LEAVE_REQUEST", "LEAVES"), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const userId = req.user.userId;
        const { type, startDate, endDate, reason } = req.body;
        if (!type || !startDate || !endDate) {
            return res.status(400).json({ error: "Type, Start Date, and End Date are required" });
        }
        const leave = await prisma.leaverequest.create({
            data: {
                id: randomUUID(),
                userId,
                tenantId: tenantId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason
            }
        });
        res.json({ message: "Leave request submitted", leave });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to submit leave request" });
    }
});
// Update Leave Status (Approve/Reject)
router.patch("/:id/status", authenticateToken, auditLog("LEAVE_STATUS_UPDATE", "LEAVES"), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;
        const isAdmin = req.user.roles.includes("BUSINESS_ADMIN") || req.user.roles.includes("SUPER_ADMIN");
        const isManager = req.user.roles.includes("MANAGER");
        if (!isAdmin && !isManager) {
            return res.status(403).json({ error: "Only admins or managers can approve leaves" });
        }
        const leave = await prisma.leaverequest.update({
            where: { id },
            data: {
                status,
                approvedById: userId
            }
        });
        res.json({ message: `Leave ${status.toLowerCase()} successfully`, leave });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update leave status" });
    }
});
export default router;
//# sourceMappingURL=leaves.js.map