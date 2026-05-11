import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { maskObject } from "../utils/masking.js";
const router = express.Router();

// Get Current Subscription Status
router.get("/current", authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        currentPlan: true,
        planExpiry: true,
        subscription: true
      }
    });

    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const tenantWithSubscriptions = {
      ...tenant,
      subscriptions: tenant.subscription ? [tenant.subscription] : []
    };
    delete (tenantWithSubscriptions as any).subscription;

    // 🔒 PII Masking during impersonation
    let data = tenantWithSubscriptions;
    if (req.user?.isImpersonating) {
      data = {
        ...tenantWithSubscriptions,
        subscriptions: tenantWithSubscriptions.subscriptions.map((s: any) => maskObject(s))
      };
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// Upgrade / Change Plan
router.post("/change", authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { planCode, billingCycle, amount } = req.body;

    if (!planCode) return res.status(400).json({ error: "Plan code required" });

    const subscription = await SubscriptionService.createSubscription(
      tenantId!,
      planCode,
      billingCycle,
      { 
        amount,
        performedBy: req.user?.userId 
      }
    );

    res.json({ 
      success: true, 
      message: `Successfully switched to ${planCode}`,
      subscription
    });
  } catch (error: any) {
    console.error("[Subscriptions] Change Error:", error);
    res.status(500).json({ error: error.message || "Failed to change plan" });
  }
});

export default router;
