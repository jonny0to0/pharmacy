import express, { type Request, type Response } from "express";
import prisma from "../../db.js";
import { authenticateToken, authorizeRoles, authorizePermission } from "../../middleware/auth.js";
import { sendSuccess } from "../../utils/response.js";
import { adminCache } from "../../services/AdminCacheService.js";

const router = express.Router();

/**
 * @route   GET /api/v1/admin/feature-flags
 */
router.get("/", authorizePermission("manage_flags"), async (req: Request, res: Response) => {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' }
    });
    return sendSuccess(res, flags);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch flags" });
  }
});

/**
 * @route   POST /api/v1/admin/feature-flags
 */
router.post("/", authorizePermission("manage_flags", "FULL"), async (req: Request, res: Response) => {
  try {
    const { key, name, description, enabled, environment, rolloutPercentage, targetRole } = req.body;

    const flag = await prisma.featureFlag.create({
      data: {
        key,
        name,
        description,
        enabled,
        environment,
        rolloutPercentage: rolloutPercentage || 100,
        targetRole
      }
    });

    adminCache.invalidatePrefix("flags:");
    return sendSuccess(res, flag, "Feature flag created");
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ success: false, error: "Flag key must be unique" });
    res.status(500).json({ success: false, error: "Failed to create flag" });
  }
});

/**
 * @route   PATCH /api/v1/admin/feature-flags/:id
 */
router.patch("/:id", authorizePermission("manage_flags", "FULL"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, enabled, environment, rolloutPercentage, targetRole } = req.body;

    const flag = await prisma.featureFlag.update({
      where: { id },
      data: {
        name,
        description,
        enabled,
        environment,
        rolloutPercentage,
        targetRole
      }
    });

    adminCache.invalidatePrefix("flags:");
    return sendSuccess(res, flag, "Feature flag updated");
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update flag" });
  }
});

/**
 * @route   DELETE /api/v1/admin/feature-flags/:id
 */
router.delete("/:id", authorizePermission("manage_flags", "FULL"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.featureFlag.delete({ where: { id } });
    adminCache.invalidatePrefix("flags:");
    return sendSuccess(res, null, "Feature flag deleted");
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete flag" });
  }
});

export default router;
