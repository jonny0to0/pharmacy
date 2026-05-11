import express, { type Request, type Response } from "express";
import prisma from "../../db.js";
import { sendSuccess } from "../../utils/response.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { createAuditLog } from "../../services/auditService.js";

const router = express.Router();

// All routes here require SUPER_ADMIN role
router.use(authenticateToken);
router.use(authorizeRoles("SUPER_ADMIN"));

/**
 * Global User Search across all tenants
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: "Search query required" });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: String(q) } },
          { email: { contains: String(q) } },
          { mobile: { contains: String(q) } }
        ]
      },
      include: {
        tenant: true,
        userrole: { include: { role: true } }
      },
      take: 20
    });

    return sendSuccess(res, users);
  } catch (error) {
    res.status(500).json({ success: false, error: "Search failed" });
  }
});

/**
 * Get all users across the platform (Paginated)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        tenant: true,
        userrole: { include: { role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return sendSuccess(res, users);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

/**
 * Administrative action: Toggle User Status
 */
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status, isActive }
    });

    await createAuditLog(req.user!.userId, "USER", "UPDATE_STATUS", id, { status, isActive });

    return sendSuccess(res, user, "User status updated successfully");
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update user status" });
  }
});

export default router;
