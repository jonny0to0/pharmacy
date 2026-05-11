import { basePrisma } from "./src/db.js";
import bcrypt from "bcryptjs";
import { SubscriptionService } from "./src/services/SubscriptionService.js";
import { randomUUID } from "crypto";

async function main() {
  const name = "Base Prisma Manual ID Test User";
  const email = `base_manual_id_${Date.now()}@example.com`;
  const mobile = `${Date.now()}`.slice(-10);
  const password = "Password123!";
  const businessName = "Base Manual ID Pharma";

  console.log("🚀 Starting Base Prisma Manual ID Test...");

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await basePrisma.$transaction(async (tx) => {
      const tenantId = randomUUID();
      const userId = randomUUID();

      console.log("1. Creating Tenant with manual ID:", tenantId);
      const tenant = await tx.tenant.create({
        data: { id: tenantId, businessName, isSetupCompleted: false },
      });

      console.log("2. Creating User with manual ID:", userId);
      const newUser = await tx.user.create({
        data: { id: userId, name, email, mobile, password: hashedPassword, role: "BUSINESS_ADMIN", status: "ACTIVE", tenantId: tenant.id }
      });
      
      return { user: newUser, tenant };
    });

    console.log("🎉 SUCCESS! Base Prisma Manual ID registration worked.");
  } catch (error) {
    console.error("❌ Base Prisma Manual ID Registration Failed:", error);
  }
}

main().catch(console.error).finally(() => basePrisma.$disconnect());
