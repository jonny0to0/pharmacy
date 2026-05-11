import prisma from "../db.js";
import { 
  subscription_processingState, 
  subscription_status, 
  subscriptionpendingchange_type,
  plan_type
} from "@prisma/client";
import { PlanService } from "./PlanService.js";
import { mapPlanRelations } from "../utils/planMapper.js";

export interface ProrationSnapshot {
  oldPrice: number;
  newPrice: number;
  daysRemaining: number;
  totalDays: number;
  calculatedCredit: number;
  upgradeCharge: number;
  timestamp: string;
}

export class BillingService {
  /**
   * Lock a subscription for processing to prevent race conditions
   */
  public static async lockSubscription(subscriptionId: string, externalTx?: any) {
    const execute = async (tx: any) => {
      const sub = await (tx as any).subscription.findUnique({
        where: { id: subscriptionId },
        select: { processingState: true }
      });

      if (!sub) throw new Error("Subscription not found");
      if (sub.processingState !== subscription_processingState.IDLE) {
        throw new Error("Subscription is currently being processed by another task");
      }

      await (tx as any).subscription.update({
        where: { id: subscriptionId },
        data: { processingState: subscription_processingState.LOCKED }
      });
    };

    if (externalTx) {
      return await execute(externalTx);
    }
    return await prisma.$transaction(execute);
  }

  /**
   * Unlock a subscription
   */
  public static async unlockSubscription(subscriptionId: string) {
    await (prisma as any).subscription.update({
      where: { id: subscriptionId },
      data: { processingState: subscription_processingState.IDLE }
    });
  }

  /**
   * Calculate proration for an upgrade
   */
  public static async calculateUpgradeProration(
    subscriptionId: string, 
    newPlanId: string
  ): Promise<ProrationSnapshot> {
    const sub = await (prisma as any).subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!sub || !sub.plan || !sub.currentPeriodEnd) {
      throw new Error("Cannot calculate proration for this subscription");
    }

    const newPlan = await (prisma as any).plan.findUnique({
      where: { id: newPlanId }
    });

    if (!newPlan) throw new Error("New plan not found");

    const now = new Date();
    const periodStart = sub.currentPeriodStart;
    const periodEnd = sub.currentPeriodEnd;
    
    const totalDuration = periodEnd.getTime() - periodStart.getTime();
    const remainingDuration = periodEnd.getTime() - now.getTime();
    
    // Safety check for expired or near-expired
    const daysRemaining = Math.max(0, remainingDuration / (1000 * 60 * 60 * 24));
    const totalDays = totalDuration / (1000 * 60 * 60 * 24);
    const prorationRatio = Math.max(0, Math.min(1, remainingDuration / totalDuration));

    const remainingValue = sub.amount * prorationRatio;
    const upgradeCharge = Math.max(0, newPlan.price - remainingValue);

    return {
      oldPrice: sub.amount,
      newPrice: newPlan.price,
      daysRemaining: parseFloat(daysRemaining.toFixed(4)),
      totalDays: parseFloat(totalDays.toFixed(4)),
      calculatedCredit: parseFloat(remainingValue.toFixed(2)),
      upgradeCharge: parseFloat(upgradeCharge.toFixed(2)),
      timestamp: now.toISOString()
    };
  }

  /**
   * Schedule a downgrade for the end of the current billing cycle
   */
  public static async scheduleDowngrade(
    subscriptionId: string,
    targetPlanId: string,
    targetPlanVersion: number
  ) {
    const sub = await (prisma as any).subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!sub || !sub.currentPeriodEnd) throw new Error("Subscription not found");

    // Check if there's already a pending change
    const existing = await (prisma as any).subscriptionpendingchange.findFirst({
        where: { subscriptionId, applied: false }
    });

    if (existing) {
        await (prisma as any).subscriptionpendingchange.delete({ where: { id: existing.id } });
    }

    return await (prisma as any).subscriptionpendingchange.create({
      data: {
        subscriptionId,
        targetPlanId,
        targetPlanVersion,
        type: subscriptionpendingchange_type.DOWNGRADE,
        effectiveDate: sub.currentPeriodEnd,
        applied: false
      }
    });
  }

  /**
   * Apply all pending changes that have reached their effective date
   */
  public static async applyPendingChanges() {
    const now = new Date();
    const pending = await (prisma as any).subscriptionpendingchange.findMany({
      where: { 
        applied: false,
        effectiveDate: { lte: now }
      },
      include: { subscription: true }
    });

    console.log(`[BillingService] Found ${pending.length} pending changes to apply`);

    for (const change of pending) {
      try {
        await this.processPendingChange(change);
      } catch (error) {
        console.error(`[BillingService] Failed to apply pending change ${change.id}:`, error);
        // Error handling: mark for retry or log
      }
    }
  }

  private static async processPendingChange(change: any) {
    return await prisma.$transaction(async (tx) => {
        // Double check idempotency
        const freshChange = await (tx as any).subscriptionpendingchange.findUnique({
            where: { id: change.id }
        });
        if (!freshChange || freshChange.applied) return;

        // 1. Get New Plan Details
        const newPlan = await (tx as any).plan.findUnique({
            where: { id: change.targetPlanId },
            include: { planfeature: true, planlimit: true }
        });
        if (!newPlan) throw new Error("Target plan not found");
        
        // Fail-fast
        if (!newPlan.planfeature || !newPlan.planlimit) {
            throw new Error(`[BillingService] Critical: Relations not loaded for plan ${newPlan.id}`);
        }

        const normalizedPlan = mapPlanRelations(newPlan);
        const { featuresSnapshot, limitsSnapshot } = await PlanService.generateSnapshots(normalizedPlan.id);

        // 2. Update Subscription
        const startDate = new Date(change.effectiveDate);
        let endDate: Date | null = null;
        
        if (newPlan.type !== plan_type.LIFETIME) {
            endDate = new Date(startDate);
            if (change.subscription.billingCycle === "YEARLY") {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }
        }

        await (tx as any).subscription.update({
            where: { id: change.subscriptionId },
            data: {
                planId: newPlan.id,
                planVersion: newPlan.version,
                planName: newPlan.code as any,
                status: subscription_status.ACTIVE,
                currentPeriodStart: startDate,
                currentPeriodEnd: endDate,
                amount: newPlan.price,
                featuresSnapshot: JSON.stringify(featuresSnapshot),
                limitsSnapshot: JSON.stringify(limitsSnapshot),
                updatedAt: new Date()
            }
        });

        // 3. Update Tenant
        await (tx as any).tenant.update({
            where: { id: change.subscription.tenantId },
            data: { 
                currentPlan: newPlan.code as any,
                planExpiry: endDate
            }
        });

        // 4. Mark change as applied
        await (tx as any).subscriptionpendingchange.update({
            where: { id: change.id },
            data: { applied: true }
        });

        // 5. Audit Log
        await (tx as any).subscriptionevent.create({
            data: {
                subscriptionId: change.subscriptionId,
                newState: subscription_status.ACTIVE,
                eventType: "PLAN_CHANGED",
                source: "SYSTEM",
                reason: `Downgrade applied to ${newPlan.name} (v${newPlan.version})`,
                metadata: JSON.stringify({ from: change.subscription.planName, to: newPlan.code })
            }
        });
    });
  }
}
