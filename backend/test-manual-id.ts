import prisma from "./src/db.js";
import bcrypt from "bcryptjs";
import { SubscriptionService } from "./src/services/SubscriptionService.js";
import { randomUUID } from "crypto";

async function main() {
  const name = "Manual ID Test User";
  const email = `manual_id_${Date.now()}@example.com`;
  const mobile = `${Date.now()}`.slice(-10);
  const password = "Password123!";
  const businessName = "Manual ID Pharma";

  console.log("🚀 Starting Manual ID Test...");

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await prisma.$transaction(async (tx) => {
      const tenantId = randomUUID();
      const userId = randomUUID();
      const settingsId = randomUUID();
      const prefId = randomUUID();

      console.log("1. Creating Tenant with manual ID:", tenantId);
      const tenant = await tx.tenant.create({
        data: { id: tenantId, businessName, isSetupCompleted: false },
      });

      console.log("2. Creating TenantSettings...");
      await tx.tenantsettings.create({ data: { id: settingsId, tenantId: tenant.id } });

      console.log("3. Creating User with manual ID:", userId);
      const newUser = await tx.user.create({
        data: { id: userId, name, email, mobile, password: hashedPassword, role: "BUSINESS_ADMIN", status: "ACTIVE", tenantId: tenant.id }
      });

      console.log("4. Finding Role...");
      const role = await tx.role.findFirst({ where: { name: 'BUSINESS_ADMIN', tenantId: null } });

      if (role) {
        console.log("5. Assigning Role...");
        await tx.userrole.create({ data: { userId: newUser.id, roleId: role.id } });
      }

      console.log("6. Creating Subscription...");
      await SubscriptionService.createSubscription(tenant.id, "FREE", "MONTHLY", { performedBy: newUser.id });

      console.log("7. Creating NotificationPreference...");
      await tx.notificationpreference.create({
        data: { id: prefId, userId: newUser.id, email: true, inApp: true, lowStock: true, newOrder: true }
      });
      
      return { user: newUser, tenant };
    });

    console.log("🎉 SUCCESS! Manual ID registration worked.");
  } catch (error) {
    console.error("❌ Manual ID Registration Failed:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
