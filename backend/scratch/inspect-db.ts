import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });

  console.log("=== TENANTS AND USERS ===");
  console.dir(tenants, { depth: null });

  const roles = await prisma.role.findMany({
    include: {
      rolepermission: {
        include: {
          permission: true
        }
      }
    }
  });

  console.log("\n=== ROLES ===");
  console.dir(roles.map(r => ({ name: r.name, isSystem: r.isSystem, permissionsCount: r.rolepermission.length })), { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
