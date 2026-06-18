import prisma from "./src/db.js";
import bcrypt from "bcryptjs";
import { SubscriptionService } from "./src/services/SubscriptionService.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    { userId: user.id, roles: user.roles, tenantId: user.tenantId },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

async function main() {
  const name = "Test User Final Iteration";
  const email = `final_test_success_${Date.now()}@example.com`;
  const mobile = `98765${Math.floor(10000 + Math.random() * 90000)}`;
  const password = "Password123!";
  const businessName = "Final Test Pharma";

  console.log("🚀 Starting Registration Script Test...");

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await prisma.$transaction(async (tx) => {
      console.log("1. Creating Tenant...");
      const tenantId = randomUUID();
      const tenant = await tx.tenant.create({
        data: { id: tenantId, businessName, isSetupCompleted: false, updatedAt: new Date() },
      });
      console.log("Tenant ID:", tenant.id);

      console.log("2. Creating TenantSettings...");
      await tx.tenantsettings.create({ data: { id: randomUUID(), tenantId: tenant.id } });

      console.log("3. Creating User...");
      const userId = randomUUID();
      const newUser = await tx.user.create({
        data: { id: userId, name, email, mobile, password: hashedPassword, role: "BUSINESS_ADMIN", status: "ACTIVE", tenantId: tenant.id, updatedAt: new Date() }
      });
      console.log("User ID:", newUser.id);

      console.log("4. Finding Business Admin Role...");
      const businessAdminRole = await tx.role.findFirst({
        where: { name: 'BUSINESS_ADMIN', tenantId: null }
      });

      if (businessAdminRole) {
        console.log("5. Assigning Role...");
        await tx.userrole.create({
          data: { id: randomUUID(), userId: newUser.id, roleId: businessAdminRole.id }
        });
      }

      console.log("6. Creating Subscription...");
      await SubscriptionService.createSubscription(tenant.id, "FREE", "MONTHLY", { performedBy: newUser.id, tx });

      console.log("7. Creating NotificationPreference...");
      const pref = await tx.notificationpreference.create({
        data: { id: randomUUID(), userId: newUser.id, email: true, inApp: true, lowStock: true, newOrder: true }
      });
      console.log("Notification Preference ID:", pref.id);
      
      return { user: newUser, tenant, roles: [businessAdminRole?.name || 'BUSINESS_ADMIN'] };
    });

    console.log("✅ Transaction Success.");
  } catch (error: any) {
    console.error("❌ Registration Failed:", error);
    if (error.code === 'P2002') {
      console.error("Constraint Violation Detail:", error.meta);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
