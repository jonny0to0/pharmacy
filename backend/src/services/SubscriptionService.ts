import prisma from "../db.js";
import { subscription_status, subscriptionevent_source, plan_type } from "@prisma/client";
import { randomUUID } from "crypto";
import { PlanService } from "./PlanService.js";
import { BillingService } from "./BillingService.js";
import { mapPlanRelations } from "../utils/planMapper.js";

export class SubscriptionService {
  private static transitions: Record<subscription_status, subscription_status[]> = {
    INACTIVE: [subscription_status.TRIAL, subscription_status.ACTIVE],
    TRIAL: [subscription_status.ACTIVE, subscription_status.CANCELLED, subscription_status.EXPIRED],
    ACTIVE: [subscription_status.SUSPENDED, subscription_status.CANCELLED, subscription_status.PAST_DUE],
    PAST_DUE: [subscription_status.ACTIVE, subscription_status.CANCELLED, subscription_status.EXPIRED],
    SUSPENDED: [subscription_status.ACTIVE, subscription_status.CANCELLED],
    CANCELLED: [],
    EXPIRED: [subscription_status.ACTIVE],
    PENDING: [subscription_status.ACTIVE, subscription_status.CANCELLED, subscription_status.EXPIRED]
  };

  /**
   * Validate if a transition from current status to new status is allowed
   */
  public static assertValidTransition(from: subscription_status, to: subscription_status) {
    const allowed = this.transitions[from] || [];
    if (!allowed.includes(to)) {
      throw new Error(`Invalid state transition: Cannot move subscription from ${from} to ${to}.`);
    }
  }

  /**
   * Perform a status transition on a subscription (Hardened with Concurrency Locking)
   */
  public static async transition(
    subscriptionId: string,
    newStatus: subscription_status,
    options: {
      reason?: string;
      performedBy?: string;
      source?: subscriptionevent_source;
      metadata?: any;
      tx?: any;
    } = {}
  ) {
    // 1. Concurrency Locking (Shield against race conditions)
    await BillingService.lockSubscription(subscriptionId, options.tx);

    const execute = async (tx: any) => {
        // 2. Get current state
        const sub = await (tx as any).subscription.findUnique({
          where: { id: subscriptionId },
          select: { id: true, status: true }
        });

        if (!sub) throw new Error("Subscription not found");

        // 3. Validate transition
        if (sub.status !== newStatus) {
          this.assertValidTransition(sub.status, newStatus);
        }

        // 4. Update subscription
        const updated = await (tx as any).subscription.update({
          where: { id: subscriptionId },
          data: { 
            status: newStatus,
            updatedAt: new Date()
          }
        });

        // 5. Log event (Event-Sourced audit trail)
        await (tx as any).subscriptionevent.create({
          data: {
            subscriptionId: sub.id,
            previousState: sub.status as any,
            newState: newStatus as any,
            eventType: `TRANSITION_${newStatus}`,
            source: options.source || subscriptionevent_source.SYSTEM,
            reason: options.reason,
            performedBy: options.performedBy,
            metadata: options.metadata ? JSON.stringify(options.metadata) : "{}"
          }
        });

        return updated;
      };

    try {
      if (options.tx) {
        return await execute(options.tx);
      }
      return await prisma.$transaction(execute);
    } finally {
      // 6. Release Lock
      await BillingService.unlockSubscription(subscriptionId);
    }
  }

  /**
   * Create a new subscription for a tenant (with snapshots)
   */
  public static async createSubscription(
    tenantId: string,
    planCode: string,
    billingCycle: string = "MONTHLY",
    options: { amount?: number; isLifetime?: boolean; performedBy?: string; tx?: any } = {}
  ) {
    const execute = async (tx: any) => {
      // 1. Get the current version of the plan
      const plan = await tx.plan.findFirst({
        where: { code: planCode, isCurrent: true, isActive: true },
        include: { planfeature: true, planlimit: true }
      });

      if (!plan) throw new Error(`Plan ${planCode} not found or inactive`);
      
      // Fail-fast: Ensure relations were loaded
      if (!plan.planfeature || !plan.planlimit) {
        throw new Error(`[SubscriptionService] Critical: Relations not loaded for plan ${planCode}`);
      }

      const normalizedPlan = mapPlanRelations(plan);
      
      // 2. Generate Snapshots (Pass tx if available)
      const { featuresSnapshot, limitsSnapshot, planVersion } = await PlanService.generateSnapshots(normalizedPlan.id, tx);

      // 3. Calculate Dates
      const startDate = new Date();
      let endDate: Date | null = null;
      
      if (!options.isLifetime && plan.type !== plan_type.LIFETIME) {
          endDate = new Date(startDate);
          if (billingCycle === "YEARLY") {
              endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
              endDate.setMonth(endDate.getMonth() + 1);
          }
      }

       // 4. Create Subscription record
       const subscription = await (tx as any).subscription.create({
         data: {
           id: randomUUID(),
           tenantId,
           planId: plan.id,
           planVersion,
           planName: plan.code as any,
           status: subscription_status.ACTIVE,
           startDate,
           endDate,
           currentPeriodStart: startDate,
           currentPeriodEnd: endDate,
           billingCycle,
           amount: options.amount ?? plan.price,
           isLifetime: options.isLifetime || plan.type === plan_type.LIFETIME,
           featuresSnapshot: JSON.stringify(featuresSnapshot),
           limitsSnapshot: JSON.stringify(limitsSnapshot),
           autoRenew: plan.type !== plan_type.LIFETIME,
           updatedAt: new Date()
         }
       });

      // 5. Update Tenant's short-hand currentPlan
      await tx.tenant.update({
        where: { id: tenantId },
        data: { 
          currentPlan: plan.code as any,
          planExpiry: endDate
        }
      });

      // 6. Log Event
      await (tx as any).subscriptionevent.create({
        data: {
          id: randomUUID(),
          subscriptionId: subscription.id,
          newState: subscription_status.ACTIVE,
          eventType: "INITIAL_CREATION",
          source: subscriptionevent_source.SYSTEM,
          performedBy: options.performedBy || "SYSTEM",
          reason: `Subscribed to ${plan.name} (v${planVersion})`,
          metadata: JSON.stringify({ planCode, version: planVersion }),
          createdAt: new Date()
        }
      });

      return subscription;
    };

    if (options.tx) {
      return await execute(options.tx);
    }
    return await prisma.$transaction(execute);
  }

  /**
   * Enrich subscription statistics for Admin Dashboard
   */
  public static async getAdminSubscriptions(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        include: {
          tenant: {
            select: {
              businessName: true,
              _count: { select: { user: true } }
            }
          },
          plan: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.subscription.count()
    ]);

    return {
      items: items.map(sub => {
        const limits = (sub.limitsSnapshot as any) || {};
        const usersLimit = limits.users_limit || "N/A";
        
        return {
          id: sub.id,
          businessName: sub.tenant.businessName,
          planName: `${sub.plan?.name || sub.planName || "FREE"} (v${sub.planVersion})`,
          status: sub.status,
          usersCount: `${sub.tenant._count.user} / ${usersLimit}`,
          expiryDate: sub.currentPeriodEnd,
          isLifetime: sub.isLifetime,
          billingCycle: sub.billingCycle,
          amount: sub.amount,
          mrr: sub.billingCycle === "MONTHLY" ? sub.amount : (sub.amount / 12)
        };
      }),
      total
    };
  }
}
