import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  
  console.log(`Seeding branches for ${tenants.length} tenants...`);
  
  for (const tenant of tenants) {
    // We will use a predictable ID format based on tenant ID so it's idempotent
    const mainBranchId = `main-branch-${tenant.id.slice(0, 10)}`;
    const secBranchId = `sec-branch-${tenant.id.slice(0, 10)}`;

    await prisma.branch.upsert({
      where: { id: mainBranchId },
      update: { name: "Main Branch" },
      create: {
        id: mainBranchId,
        name: "Main Branch",
        tenantId: tenant.id
      }
    });

    await prisma.branch.upsert({
      where: { id: secBranchId },
      update: { name: "Secondary Branch" },
      create: {
        id: secBranchId,
        name: "Secondary Branch",
        tenantId: tenant.id
      }
    });

    console.log(`Seeded branches for tenant: ${tenant.businessName}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
