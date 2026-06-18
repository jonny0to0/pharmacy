import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function test() {
  console.log("🧪 Starting programmatic verification of Roles, Permissions & Branches...");

  // 1. Verify Tenant & Roles Setup
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error("❌ No tenant found in database!");
    return;
  }
  console.log(`✅ Found test tenant: ${tenant.businessName} (ID: ${tenant.id})`);

  // 2. Test Custom Role Creation
  console.log("Creating test custom role...");
  const roleId = randomUUID();
  const testRole = await prisma.role.create({
    data: {
      id: roleId,
      name: "TEST_ROLE_" + Date.now(),
      description: "Test Custom Role",
      tenantId: tenant.id,
      isSystem: false,
      updatedAt: new Date()
    }
  });
  console.log(`✅ Custom Role created: ${testRole.name} (ID: ${testRole.id})`);

  // 3. Test Branch Seeding / Creation
  console.log("Checking for branches...");
  const branches = await prisma.branch.findMany({
    where: { tenantId: tenant.id }
  });
  console.log(`✅ Found ${branches.length} branches for tenant.`);

  if (branches.length === 0) {
    console.error("❌ No branches found. Please seed branches first.");
    return;
  }

  const branch1 = branches[0];
  console.log(`✅ Selected branch for testing: ${branch1.name} (ID: ${branch1.id})`);

  // 4. Test User creation with Role and Branch
  console.log("Creating test staff user...");
  const userId = randomUUID();
  const testUser = await prisma.user.create({
    data: {
      id: userId,
      name: "Test Staff " + Date.now(),
      email: `test_staff_${Date.now()}@example.com`,
      mobile: `99${String(Date.now()).slice(-8)}`,
      role: "CASHIER",
      tenantId: tenant.id,
      status: "ACTIVE",
      updatedAt: new Date()
    }
  });
  console.log(`✅ User created: ${testUser.email} (ID: ${testUser.id})`);

  // Link user to role
  await prisma.userrole.create({
    data: {
      id: randomUUID(),
      userId: testUser.id,
      roleId: testRole.id
    }
  });
  console.log(`✅ Linked test user to role: ${testRole.name}`);

  // Link user to branch
  const userBranch = await prisma.userbranch.create({
    data: {
      id: randomUUID(),
      userId: testUser.id,
      branchId: branch1.id
    }
  });
  console.log(`✅ Linked test user to branch: ${branch1.name}`);

  // Verify relations are loaded correctly
  const loadedUser = await prisma.user.findUnique({
    where: { id: testUser.id },
    include: {
      userrole: { include: { role: true } },
      userbranch: { include: { branch: true } }
    }
  });

  if (loadedUser?.userrole[0]?.role.id === testRole.id && loadedUser?.userbranch[0]?.branch.id === branch1.id) {
    console.log("🎉 Programmatic verification SUCCEEDED!");
  } else {
    console.error("❌ Programmatic verification FAILED! Linked entities do not match.");
  }

  // Cleanup
  console.log("Cleaning up test records...");
  await prisma.userbranch.delete({ where: { id: userBranch.id } });
  await prisma.userrole.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
  await prisma.role.delete({ where: { id: testRole.id } });
  console.log("🧹 Cleanup complete.");
}

test().catch(console.error).finally(() => prisma.$disconnect());
