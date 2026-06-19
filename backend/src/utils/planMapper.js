/**
 * Anti-Corruption Layer: Maps Prisma's auto-generated relation names
 * to the domain model expected by the application.
 */
export function mapPlanRelations(plan) {
    if (!plan) {
        throw new Error("mapPlanRelations: plan is undefined");
    }
    // Debug logging in non-production environments
    if (process.env.NODE_ENV !== "production") {
        console.debug("[PlanMapper] Normalizing Plan Data:", {
            id: plan.id,
            code: plan.code,
            hasPlanFeature: !!plan.planfeature,
            hasPlanLimit: !!plan.planlimit,
            featureCount: plan.planfeature?.length || 0,
            limitCount: plan.planlimit?.length || 0
        });
    }
    // Fail-fast verification: Ensure relations were actually loaded if we expect them
    // This helps catch missing 'include' blocks in Prisma queries
    if (plan.planfeature === undefined || plan.planlimit === undefined) {
        console.warn(`[PlanMapper] Warning: Relations (planfeature/planlimit) were not loaded for plan: ${plan.id}`);
    }
    return {
        ...plan,
        features: plan.planfeature ?? [],
        limits: plan.planlimit ?? [],
    };
}
//# sourceMappingURL=planMapper.js.map