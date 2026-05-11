import express, { type Request, type Response } from "express";
import { authorizePermission } from "../../middleware/auth.js";
import { PlanService } from "../../services/PlanService.js";
import { sendSuccess } from "../../utils/response.js";

const router = express.Router();

/**
 * @route   GET /api/v1/admin/plans
 * @desc    List all plan versions
 */
router.get("/", authorizePermission("manage_subscriptions"), async (req: Request, res: Response) => {
  try {
    const plans = await PlanService.getAdminPlans();
    return sendSuccess(res, plans, "Plans fetched successfully");
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

/**
 * @route   POST /api/v1/admin/plans
 * @desc    Create a new plan version (Grandfathering Strategy)
 */
router.post("/", authorizePermission("manage_subscriptions", "FULL"), async (req: Request, res: Response) => {
  try {
    const { code, ...data } = req.body;
    
    if (!code) return res.status(400).json({ error: "Plan code is required" });

    const newPlan = await PlanService.createNewVersion(code, data);
    return sendSuccess(res, newPlan, `New version of ${code} (v${newPlan.version}) created successfully`);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create plan version" });
  }
});

/**
 * @route   PATCH /api/v1/admin/plans/:id/deactivate
 * @desc    Deactivate a plan version
 */
router.patch("/:id/deactivate", authorizePermission("manage_subscriptions", "FULL"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await PlanService.deactivatePlan(id);
    return sendSuccess(res, null, "Plan deactivated successfully");
  } catch (error) {
    res.status(500).json({ error: "Failed to deactivate plan" });
  }
});

export default router;
