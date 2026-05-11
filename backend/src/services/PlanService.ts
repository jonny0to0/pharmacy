import prisma from "../db.js";
import { plan_type } from "@prisma/client";
import { mapPlanRelations } from "../utils/planMapper.js";

export class PlanService {
  /**
   * Get all active and current plans with their feature and limit definitions
   */
  public static async getPublicPlans() {
    const plans = await prisma.plan.findMany({
      where: { isActive: true, isCurrent: true },
      include: {
        planfeature: true,
        planlimit: true
      },
      orderBy: { price: "asc" }
    });
    return plans.map(p => mapPlanRelations(p));
  }

  /**
   * Get all plans for admin management (all versions)
   */
  public static async getAdminPlans() {
    const plans = await prisma.plan.findMany({
      include: {
        planfeature: true,
        planlimit: true,
        _count: { select: { subscription: true } }
      },
      orderBy: [
        { code: "asc" },
        { version: "desc" }
      ]
    });
    return plans.map(p => mapPlanRelations(p));
  }

  /**
   * Get effective plan for a tenant (from subscription snapshot)
   */
  public static async getTenantPlanSnapshot(tenantId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      select: {
        featuresSnapshot: true,
        limitsSnapshot: true,
        planId: true,
        planVersion: true,
        status: true
      }
    });

    if (!subscription) return null;

    return {
      features: (subscription.featuresSnapshot as Record<string, boolean>) || {},
      limits: (subscription.limitsSnapshot as Record<string, number>) || {},
      planId: subscription.planId,
      version: subscription.planVersion,
      status: subscription.status
    };
  }

  /**
   * Generate strict snapshots for a plan to be stored in a subscription
   */
  public static async generateSnapshots(planId: string, tx?: any) {
    const client = tx || prisma;
    const plan = await client.plan.findUnique({
      where: { id: planId },
      include: {
        planfeature: true,
        planlimit: true
      }
    });

    if (!plan) throw new Error("Plan not found");

    // Fail-fast
    if (!plan.planfeature || !plan.planlimit) {
      throw new Error(`[PlanService] Critical: Relations not loaded for plan ${planId}`);
    }

    const normalizedPlan = mapPlanRelations(plan);

    const featuresSnapshot: Record<string, boolean> = {};
    normalizedPlan.features.forEach((f: any) => {
      featuresSnapshot[f.featureKey] = f.enabled;
    });

    const limitsSnapshot: Record<string, number> = {};
    normalizedPlan.limits.forEach((l: any) => {
      limitsSnapshot[l.limitKey] = l.value;
    });

    return {
      featuresSnapshot,
      limitsSnapshot,
      planVersion: plan.version,
      planName: plan.name
    };
  }

  /**
   * Create a new version of an existing plan (Grandfathering Strategy)
   */
  public static async createNewVersion(code: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get latest version of this code
      const latest = await tx.plan.findFirst({
        where: { code, isCurrent: true },
        orderBy: { version: "desc" }
      });

      const nextVersion = latest ? latest.version + 1 : 1;

      // 2. Mark previous current as not current
      if (latest) {
        await tx.plan.update({
          where: { id: latest.id },
          data: { isCurrent: false }
        });
      }

      // 3. Create new plan version
      const newPlan = await tx.plan.create({
        data: {
          code,
          version: nextVersion,
          name: data.name,
          description: data.description,
          price: data.price,
          billingCycle: data.billingCycle || "MONTHLY",
          type: data.type || plan_type.SUBSCRIPTION,
          changeLog: data.changeLog,
          isCurrent: true,
          isActive: true,
          isDefault: data.isDefault || false
        }
      });

      // 4. Seed Features (either from data or clone from latest)
      const featuresToApply = data.features || (latest ? await tx.planfeature.findMany({ where: { planId: latest.id } }) : {});
      
      if (Array.isArray(featuresToApply)) {
          // Cloned from latest
          for (const f of featuresToApply) {
              await tx.planfeature.create({
                  data: { planId: newPlan.id, featureKey: f.featureKey, enabled: f.enabled }
              });
          }
      } else {
          // From data object
          for (const [key, enabled] of Object.entries(featuresToApply)) {
              await tx.planfeature.create({
                  data: { planId: newPlan.id, featureKey: key, enabled: !!enabled }
              });
          }
      }

      // 5. Seed Limits
      const limitsToApply = data.limits || (latest ? await tx.planlimit.findMany({ where: { planId: latest.id } }) : {});

      if (Array.isArray(limitsToApply)) {
          for (const l of limitsToApply) {
              await tx.planlimit.create({
                  data: { planId: newPlan.id, limitKey: l.limitKey, value: l.value }
              });
          }
      } else {
          for (const [key, value] of Object.entries(limitsToApply)) {
              await tx.planlimit.create({
                  data: { planId: newPlan.id, limitKey: key, value: Number(value) }
              });
          }
      }

      return newPlan;
    });
  }

  /**
   * Deactivate a plan (prevents new signups)
   */
  public static async deactivatePlan(id: string) {
      return await prisma.plan.update({
          where: { id },
          data: { isActive: false }
      });
  }
}
