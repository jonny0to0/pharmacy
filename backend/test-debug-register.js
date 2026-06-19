import { basePrisma } from "./src/db.js";
import bcrypt from "bcryptjs";
import { SubscriptionService } from "./src/services/SubscriptionService.js";
import { randomUUID } from "crypto";
async function main() {
    const name = "Detailed Error Test User";
    const email = `detailed_error_${Date.now()}@example.com`;
    const mobile = `${Date.now()}`.slice(-10);
    const password = "Password123!";
    const businessName = "Detailed Error Pharma";
    console.log("🚀 Starting Detailed Error Test...");
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await basePrisma.$transaction(async (tx) => {
            const tenantId = randomUUID();
            const userId = randomUUID();
            console.log("1. Creating Tenant...");
            const tenant = await tx.tenant.create({
                data: { id: tenantId, businessName, isSetupCompleted: false, updatedAt: new Date() },
            });
            console.log("2. Creating TenantSettings...");
            await tx.tenantsettings.create({ data: { id: randomUUID(), tenantId: tenant.id, updatedAt: new Date() } });
            console.log("3. Creating User...");
            const newUser = await tx.user.create({
                data: { id: userId, name, email, mobile, password: hashedPassword, role: "BUSINESS_ADMIN", status: "ACTIVE", tenantId: tenant.id, updatedAt: new Date() }
            });
            console.log("4. Finding Role...");
            const role = await tx.role.findFirst({ where: { name: 'BUSINESS_ADMIN', tenantId: null } });
            if (role) {
                console.log("5. Assigning Role...");
                await tx.userrole.create({ data: { id: randomUUID(), userId: newUser.id, roleId: role.id, updatedAt: new Date() } });
            }
            console.log("6. Creating Subscription...");
            await SubscriptionService.createSubscription(tenant.id, "FREE", "MONTHLY", { performedBy: newUser.id });
            console.log("7. Creating NotificationPreference...");
            await tx.notificationpreference.create({
                data: { id: randomUUID(), userId: newUser.id, email: true, inApp: true, lowStock: true, newOrder: true, updatedAt: new Date() }
            });
            console.log("🎉 SUCCESS in transaction!");
        });
    }
    catch (error) {
        console.error("❌ Registration simulation failed with error:");
        console.error(error);
        if (error.code)
            console.error("Error Code:", error.code);
        if (error.meta)
            console.error("Error Meta:", JSON.stringify(error.meta, null, 2));
    }
}
main().catch(console.error).finally(() => basePrisma.$disconnect());
//# sourceMappingURL=test-debug-register.js.map