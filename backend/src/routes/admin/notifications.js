import express, {} from "express";
import prisma from "../../db.js";
import { authorizePermission } from "../../middleware/auth.js";
import { sendSuccess } from "../../utils/response.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
const router = express.Router();
/**
 * @route   POST /api/v1/admin/notifications/broadcast
 * @desc    Send a global notification to all users or specific roles
 */
router.post("/broadcast", authorizePermission("broadcast_notifications", "FULL"), async (req, res) => {
    try {
        const { title, message, type, targetRole, actionUrl } = req.body;
        if (!title || !message)
            return res.status(400).json({ success: false, error: "Title and message required" });
        // Identify target users
        const whereClause = { isDeleted: false };
        if (targetRole) {
            whereClause.roles = { some: { role: { name: targetRole } } };
        }
        const users = await prisma.user.findMany({
            where: whereClause,
            select: { id: true }
        });
        // Bulk create notifications (Prisma doesn't have createMany for relations but we can use executeRaw or just map for this scale)
        // For production grade, we'd use a background worker. Here we'll do promise.all for simplicity.
        await prisma.$transaction(users.map(user => prisma.notification.create({
            data: {
                userId: user.id,
                title,
                message,
                type: type || 'SYSTEM',
                metadata: { actionUrl, broadcast: true }
            }
        })));
        return sendSuccess(res, { recipientCount: users.length }, "Broadcast sent successfully");
    }
    catch (error) {
        console.error("[Admin Notifications] Broadcast Error:", error);
        res.status(500).json({ success: false, error: "Broadcast failed" });
    }
});
export default router;
//# sourceMappingURL=notifications.js.map