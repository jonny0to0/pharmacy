import express, {} from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
const router = express.Router();
/**
 * @route   GET /api/v1/notifications/preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get("/preferences", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        let preferences = await prisma.notificationpreference.findUnique({
            where: { userId }
        });
        // Fallback if not initialized (though registration should handle it)
        if (!preferences) {
            preferences = await prisma.notificationpreference.create({
                data: {
                    userId,
                    email: true,
                    inApp: true,
                    lowStock: true,
                    newOrder: true
                }
            });
        }
        res.json(preferences);
    }
    catch (error) {
        console.error("Get Preferences Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * @route   PUT /api/v1/notifications/preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put("/preferences", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, inApp, lowStock, newOrder } = req.body;
        const updated = await prisma.notificationpreference.upsert({
            where: { userId },
            update: { email, inApp, lowStock, newOrder },
            create: { userId, email, inApp, lowStock, newOrder }
        });
        res.json({ success: true, message: "Preferences updated", data: updated });
    }
    catch (error) {
        console.error("Update Preferences Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * @route   GET /api/v1/notifications
 * @desc    Get recent in-app notifications
 * @access  Private
 */
router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    }
    catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put("/:id/read", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const notification = await prisma.notification.findUnique({
            where: { id }
        });
        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: "Notification not found" });
        }
        await prisma.notification.update({
            where: { id },
            data: { read: true }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Read Notification Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
//# sourceMappingURL=notifications.js.map