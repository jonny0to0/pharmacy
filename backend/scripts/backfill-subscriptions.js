import { PrismaClient, SubscriptionStatus, SubscriptionEventSource } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";
dotenv.config();
const setupPrisma = () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString)
        throw new Error("DATABASE_URL is not set");
    const dbUrl = new URL(connectionString);
    const adapter = new PrismaMariaDb({
        host: dbUrl.hostname || 'localhost',
        port: parseInt(dbUrl.port) || 3306,
        user: dbUrl.username || 'root',
        password: dbUrl.password || '',
        database: dbUrl.pathname.slice(1),
    });
    return new PrismaClient({ adapter });
};
const prisma = setupPrisma();
async function backfill() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes("--dry-run");
    const batchSize = 1000;
    console.log(`🚀 Starting Subscription Backfill Migration... ${isDryRun ? "[DRY RUN MODE]" : ""}`);
    // 1. Get all tenants that need subscription initialization or migration
    const tenants = await prisma.tenant.findMany({
        include: {
            subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        take: batchSize
    });
    console.log(`📋 Found ${tenants.length} tenants to check/process.`);
    let processed = 0;
    let errors = 0;
    // Cache plans for quick access
    const plans = await prisma.plan.findMany();
    const getPlanId = (code) => plans.find(p => p.code === code)?.id;
    for (const tenant of tenants) {
        try {
            const oldStatus = tenant.subscriptions[0]?.status || 'INACTIVE';
            const oldPlan = tenant.currentPlan || 'FREE';
            // 🗺️ Map states according to enterprise logic
            let newState;
            switch (oldStatus) {
                case 'TRIALING':
                    newState = SubscriptionStatus.TRIAL;
                    break;
                case 'ACTIVE':
                    newState = SubscriptionStatus.ACTIVE;
                    break;
                case 'PAST_DUE':
                    newState = SubscriptionStatus.PAST_DUE;
                    break;
                case 'SUSPENDED':
                    newState = SubscriptionStatus.SUSPENDED;
                    break;
                case 'CANCELLED':
                    newState = SubscriptionStatus.CANCELLED;
                    break;
                case 'ARCHIVED':
                    newState = SubscriptionStatus.EXPIRED;
                    break;
                case 'EXPIRED':
                    newState = SubscriptionStatus.EXPIRED;
                    break;
                default:
                    console.warn(`⚠️ Unknown status [${oldStatus}] for tenant ${tenant.id}. Defaulting to INACTIVE.`);
                    newState = SubscriptionStatus.INACTIVE;
            }
            const targetPlanId = getPlanId(oldPlan);
            if (!targetPlanId)
                throw new Error(`Missing Plan record for code: ${oldPlan}`);
            if (isDryRun) {
                console.log(`[DRY RUN] Would update Tenant [${tenant.businessName}] -> State: ${newState}, PlanID: ${targetPlanId}`);
            }
            else {
                await prisma.$transaction(async (tx) => {
                    // Update or Create Subscription
                    const sub = await tx.subscription.upsert({
                        where: { tenantId: tenant.id },
                        update: {
                            status: newState,
                            planId: targetPlanId,
                            planName: oldPlan
                        },
                        create: {
                            tenantId: tenant.id,
                            status: newState,
                            planId: targetPlanId,
                            planName: oldPlan,
                            startDate: tenant.createdAt,
                            currentPeriodStart: new Date(),
                            currentPeriodEnd: tenant.planExpiry
                        }
                    });
                    // Log the migration event
                    await tx.subscriptionEvent.create({
                        data: {
                            subscriptionId: sub.id,
                            newState: newState,
                            eventType: 'MIGRATION_BACKFILL',
                            source: SubscriptionEventSource.SYSTEM,
                            reason: 'Industrial Billing 2.0 Backfill',
                            performedBy: 'SYSTEM_MIGRATOR',
                            metadata: { previousStatus: oldStatus, timestamp: new Date() }
                        }
                    });
                });
            }
            processed++;
        }
        catch (err) {
            console.error(`❌ Failed to process tenant ${tenant.id}: ${err.message}`);
            errors++;
        }
    }
    console.log(`
🏁 Migration Finished:
- Processed: ${processed}
- Errors: ${errors}
- Mode: ${isDryRun ? "DRY RUN" : "FINAL"}
  `);
    if (!isDryRun && processed > 0) {
        console.log("✅ Audit Logs written to subscription_event table.");
    }
}
backfill()
    .catch(console.error)
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=backfill-subscriptions.js.map