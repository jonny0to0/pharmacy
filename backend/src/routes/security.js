import express, {} from "express";
import bcrypt from "bcryptjs";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
const router = express.Router();
/**
 * @route   POST /api/v1/security/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post("/change-password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new passwords are required" });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: "Invalid current password" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        // Optional: Invalidate all other sessions on password change
        // await prisma.session.deleteMany({
        //   where: { 
        //     userId,
        //     token: { not: req.headers['authorization']?.split(' ')[1] }
        //   }
        // });
        res.json({ success: true, message: "Password updated successfully" });
    }
    catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * @route   GET /api/v1/security/sessions
 * @desc    Get all active sessions for current user
 * @access  Private
 */
router.get("/sessions", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const currentToken = req.headers['authorization']?.split(' ')[1];
        const sessions = await prisma.session.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                token: true,
                userAgent: true,
                ip: true,
                createdAt: true,
                expiresAt: true
            }
        });
        const formattedSessions = sessions.map(s => ({
            id: s.id,
            userAgent: s.userAgent,
            ip: s.ip,
            createdAt: s.createdAt,
            isCurrent: s.token === currentToken
        }));
        res.json(formattedSessions);
    }
    catch (error) {
        console.error("Get Sessions Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * @route   DELETE /api/v1/security/sessions/:sessionId
 * @desc    Invalidate a specific session
 * @access  Private
 */
router.delete("/sessions/:sessionId", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId } = req.params;
        const session = await prisma.session.findUnique({
            where: { id: sessionId }
        });
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }
        if (session.userId !== userId) {
            return res.status(403).json({ error: "Unauthorized to delete this session" });
        }
        await prisma.session.delete({
            where: { id: sessionId }
        });
        res.json({ success: true, message: "Session invalidated successfully" });
    }
    catch (error) {
        console.error("Delete Session Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
//# sourceMappingURL=security.js.map