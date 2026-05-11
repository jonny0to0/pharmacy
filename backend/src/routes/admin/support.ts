import express, { type Request, type Response } from "express";
import prisma from "../../db.js";
import bcrypt from "bcryptjs";
import { authorizePermission } from "../../middleware/auth.js";
import { sendSuccess } from "../../utils/response.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";

const router = express.Router();

/**
 * @route   GET /api/v1/admin/support/search-user
 */
router.get("/search-user", authorizePermission("view_audit_logs"), async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ success: false, error: "Query required" });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query as string } },
          { name: { contains: query as string } },
          { mobile: { contains: query as string } }
        ]
      },
      include: { tenant: { select: { businessName: true } } },
      take: 10
    });

    return sendSuccess(res, users);
  } catch (error) {
    res.status(500).json({ success: false, error: "Search failed" });
  }
});

/**
 * @route   POST /api/v1/admin/support/force-logout
 */
router.post("/force-logout", authorizePermission("impersonate_user", "FULL"), async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    await prisma.session.deleteMany({ where: { userId } });
    return sendSuccess(res, null, "All sessions invalidated for user");
  } catch (error) {
    res.status(500).json({ success: false, error: "Logout failed" });
  }
});

/**
 * @route   POST /api/v1/admin/support/reset-password
 */
router.post("/reset-password", authorizePermission("impersonate_user", "FULL"), async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return sendSuccess(res, null, "Password reset successfully");
  } catch (error) {
    res.status(500).json({ success: false, error: "Reset failed" });
  }
});

/**
 * @route   GET /api/v1/admin/support/user-logs/:userId
 */
router.get("/user-logs/:userId", authorizePermission("view_audit_logs"), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return sendSuccess(res, logs);
  } catch (error) {
    res.status(500).json({ success: false, error: "Log fetch failed" });
  }
});

export default router;
