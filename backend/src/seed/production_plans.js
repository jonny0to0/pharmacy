import prisma from "../db.js";
import { plan_type } from "@prisma/client";
async function seedPlans() {
    console.log("🌱 Seeding Production Plans...");
    const plans = [
        {
            code: "FREE",
            name: "Free Forever",
            description: "Perfect for small pharmacies getting started.",
            price: 0,
            billingCycle: "MONTHLY",
            type: plan_type.FREE,
            isDefault: true,
            features: {
                analytics: false,
                custom_domain: false,
                priority_support: false,
                multi_branch: false,
                api_access: false,
                export_data: true,
                team_management: false,
                audit_logs: true,
                integrations: false,
            },
            limits: {
                users_limit: 1,
                storage_limit_mb: 100,
                api_requests_per_month: 1000,
                projects_limit: 1,
                branches_limit: 1,
            }
        },
        {
            code: "PRO",
            name: "Professional",
            description: "Advanced features for growing pharmacy chains.",
            price: 2499,
            billingCycle: "MONTHLY",
            type: plan_type.SUBSCRIPTION,
            isDefault: false,
            features: {
                analytics: true,
                custom_domain: true,
                priority_support: true,
                multi_branch: true,
                api_access: true,
                export_data: true,
                team_management: true,
                audit_logs: true,
                integrations: true,
            },
            limits: {
                users_limit: 10,
                storage_limit_mb: 5000,
                api_requests_per_month: 50000,
                projects_limit: 10,
                branches_limit: 5,
            }
        },
        {
            code: "ENTERPRISE",
            name: "Enterprise",
            description: "Scale without limits with dedicated infrastructure.",
            price: 9999,
            billingCycle: "MONTHLY",
            type: plan_type.SUBSCRIPTION,
            isDefault: false,
            features: {
                analytics: true,
                custom_domain: true,
                priority_support: true,
                multi_branch: true,
                api_access: true,
                export_data: true,
                team_management: true,
                audit_logs: true,
                integrations: true,
            },
            limits: {
                users_limit: 100,
                storage_limit_mb: 50000,
                api_requests_per_month: 200000,
                projects_limit: 50,
                branches_limit: 20,
            }
        }
    ];
    for (const planData of plans) {
        const { features, limits, ...baseData } = planData;
        console.log(`[Seed] Processing Plan: ${baseData.code} (v1)`);
        const plan = await prisma.plan.upsert({
            where: { code_version: { code: baseData.code, version: 1 } },
            update: {
                ...baseData,
                isCurrent: true,
            },
            create: {
                ...baseData,
                version: 1,
                isCurrent: true,
            }
        });
        // Seed Features
        for (const [key, enabled] of Object.entries(features)) {
            await prisma.planfeature.upsert({
                where: { planId_featureKey: { planId: plan.id, featureKey: key } },
                update: { enabled },
                create: { planId: plan.id, featureKey: key, enabled }
            });
        }
        // Seed Limits
        for (const [key, value] of Object.entries(limits)) {
            await prisma.planlimit.upsert({
                where: { planId_limitKey: { planId: plan.id, limitKey: key } },
                update: { value },
                create: { planId: plan.id, limitKey: key, value }
            });
        }
    }
    console.log("✅ Seeding Complete!");
}
seedPlans()
    .catch((e) => {
    console.error("❌ Seeding Failed:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=production_plans.js.map