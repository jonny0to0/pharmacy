import express, { type Request, type Response } from "express";
import prisma from "../../db.js";
import { authorizePermission } from "../../middleware/auth.js";
import { sendSuccess } from "../../utils/response.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { adminCache } from "../../services/AdminCacheService.js";

const router = express.Router();

/**
 * @route   GET /api/v1/admin/settings
 * @desc    Get all platform-wide system settings
 */
router.get("/", authorizePermission("manage_platform_settings"), async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    return sendSuccess(res, settings);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch settings" });
  }
});

/**
 * @route   PUT /api/v1/admin/settings
 * @desc    Bulk update platform settings
 */
router.put("/", authorizePermission("manage_platform_settings", "FULL"), async (req: Request, res: Response) => {
  try {
    const { settings } = req.body; // Expecting Array of { key, value }

    if (!Array.isArray(settings)) return res.status(400).json({ success: false, error: "Settings array required" });

    await prisma.$transaction(
      settings.map(s => prisma.systemSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value }
      }))
    );

    adminCache.clear(); // Clear all cached stats as they might depend on settings
    return sendSuccess(res, null, "Platform settings updated successfully");
  } catch (error) {
    res.status(500).json({ success: false, error: "Update failed" });
  }
});

export default router;
