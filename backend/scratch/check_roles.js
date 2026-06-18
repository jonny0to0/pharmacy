import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      isSystem: true,
      tenantId: true
    }
  });
  console.log("=== ALL ROLES ===");
  console.dir(roles, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
