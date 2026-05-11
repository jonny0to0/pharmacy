import express, { type Request, type Response } from "express";
import prisma from "../../db.js";
import { authorizePermission } from "../../middleware/auth.js";
import { sendSuccess, paginate } from "../../utils/response.js";
import { SubscriptionService } from "../../services/SubscriptionService.js";
import { SUBSCRIPTION_CONFIG } from "../../config/subscriptions.js";
import { subscription_status, subscriptionevent_source } from "@prisma/client";

const router = express.Router();

/**
 * @route   GET /api/v1/admin/subscriptions
 * @desc    List all platform subscriptions with enriched enterprise data
 * @access  Private (manage_subscriptions)
 */
router.get("/", authorizePermission("manage_subscriptions"), async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);

    // Feature Flag: Industrial Billing Read Path
    if (SUBSCRIPTION_CONFIG.ENABLE_NEW_SUBSCRIPTIONS_READ) {
      const { items, total } = await SubscriptionService.getAdminSubscriptions(page, limit);
      return sendSuccess(res, items, "Subscriptions fetched via Industrial Billing V2", paginate(total, page, limit));
    }

    // Fallback: Legacy Logic
    const [tenants, total] = await prisma.$transaction([
      prisma.tenant.findMany({
        include: {
          subscription: true,
          _count: { select: { user: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tenant.count()
    ]);

    const data = tenants.map(t => ({
      id: t.id,
      businessName: t.businessName,
      currentPlan: t.currentPlan,
      userCount: t._count.user,
      status: t.subscription?.status || 'INACTIVE',
      expiryDate: t.planExpiry
    }));

    return sendSuccess(res, data, "Subscriptions fetched via Legacy Logic", paginate(total, page, limit));
  } catch (error) {
    console.error("[Admin Subscriptions] List Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch subscriptions" });
  }
});

/**
 * @route   POST /api/v1/admin/subscriptions/:id/action
 * @desc    Perform a state machine transition on a subscription
 */
router.post("/:id/action", authorizePermission("manage_subscriptions", "FULL"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // This is subscriptionId
    const { action, reason, metadata } = req.body;

    // Feature Flag: Industrial Billing Write Path
    if (!SUBSCRIPTION_CONFIG.ENABLE_NEW_SUBSCRIPTIONS_WRITE) {
        return res.status(503).json({ success: false, error: "Industrial Write Path is currently disabled via feature flag." });
    }

    // 🔒 Impersonation Guard (Already handled by authorizePermission, but added here for triple safety as per requirements)
    if (req.user?.isImpersonating) {
        return res.status(403).json({ success: false, error: "Administrative safety: Subscriptions cannot be modified during impersonation." });
    }

    if (!action) return res.status(400).json({ success: false, error: "Action is required" });

    // Map action to status
    let targetStatus: subscription_status;
    switch (action.toUpperCase()) {
      case 'ACTIVATE': targetStatus = subscription_status.ACTIVE; break;
      case 'SUSPEND': targetStatus = subscription_status.SUSPENDED; break;
      case 'RESUME': targetStatus = subscription_status.ACTIVE; break; // Transitions usually move to ACTIVE
      case 'CANCEL': targetStatus = subscription_status.CANCELLED; break;
      case 'EXPIRE': targetStatus = subscription_status.EXPIRED; break;
      default: return res.status(400).json({ success: false, error: `Invalid action: ${action}` });
    }

    const updated = await SubscriptionService.transition(id, targetStatus, {
        reason,
        metadata,
        performedBy: req.user?.userId || 'SYSTEM',
        source: subscriptionevent_source.ADMIN
    });

    return sendSuccess(res, updated, `Subscription successfully moved to ${targetStatus}`);
  } catch (error: any) {
    console.error("[Admin Subscriptions] Action Error:", error);
    res.status(400).json({ success: false, error: error.message || "Failed to perform subscription action" });
  }
});

/**
 * @route   GET /api/v1/admin/subscriptions/:id
 * @desc    Get full subscription history and logs
 */
router.get("/:id", authorizePermission("manage_subscriptions"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        tenant: true,
        plan: true,
        subscriptionevent: { orderBy: { createdAt: 'desc' } },
        subscriptionpayment: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!subscription) return res.status(404).json({ success: false, error: "Subscription not found" });

    return sendSuccess(res, subscription);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch subscription details" });
  }
});

export default router;
