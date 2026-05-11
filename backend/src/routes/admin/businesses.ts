import express, { type Request, type Response } from "express";
import prisma from "../../db.js";
import { sendSuccess } from "../../utils/response.js";
import { adminCache } from "../../services/AdminCacheService.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { createAuditLog } from "../../services/auditService.js";

const router = express.Router();

// All routes here require SUPER_ADMIN role
router.use(authenticateToken);
router.use(authorizeRoles("SUPER_ADMIN"));

/**
 * List all businesses (Tenants)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { user: true }
        },
        businessprofile: true,
        subscription: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, tenants);
  } catch (error) {
    console.error("[Admin Businesses] List Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch businesses" });
  }
});

/**
 * Get detailed view of a business for administrative view
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        businessprofile: true,
        taxsettings: true,
        tenantsettings: true,
        _count: {
          select: { user: true, product: true, saleinvoice: true }
        }
      }
    });

    if (!tenant) return res.status(404).json({ success: false, error: "Business not found" });

    return sendSuccess(res, tenant);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch business details" });
  }
});

/**
 * List staff for a specific business
 */
router.get("/:id/staff", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const staff = await prisma.user.findMany({
      where: { tenantId: id, isDeleted: false },
      include: {
        userrole: { include: { role: true } }
      }
    });

    return sendSuccess(res, staff);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch tenant staff" });
  }
});

/**
 * Toggle business status (Activate/Suspend)
 */
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    
    await createAuditLog(req.user!.userId, "TENANT", "UPDATE_STATUS", id, { status });
    adminCache.clear();

    return sendSuccess(res, null, `Business status updated to ${status}`);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update business status" });
  }
});

/**
 * Reset setup flag for a business
 */
router.post("/:id/reset-setup", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.tenant.update({
      where: { id },
      data: { isSetupCompleted: false }
    });

    await createAuditLog(req.user!.userId, "TENANT", "RESET_SETUP", id, { 
      message: "Business setup reset by Super Admin" 
    });

    return sendSuccess(res, null, "Business setup flag reset successfully");
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to reset business setup" });
  }
});

export default router;
