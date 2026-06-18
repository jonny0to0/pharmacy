import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== ROLES IN DATABASE ===");
  const roles = await prisma.role.findMany();
  for (const r of roles) {
    console.log(`ID: ${r.id} | Name: ${r.name} | Tenant: ${r.tenantId} | IsSystem: ${r.isSystem}`);
  }

  console.log("\n=== USERS IN DATABASE ===");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  for (const u of users) {
    console.log(`ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Mobile: ${u.mobile} | Role: ${u.role} | TenantId: ${u.tenantId} | CreatedById: ${u.createdById} | inviteToken: ${u.inviteToken}`);
  }

  console.log("\n=== USER ROLES IN DATABASE ===");
  const userRoles = await prisma.userrole.findMany({
    include: {
      user: true,
      role: true
    }
  });
  for (const ur of userRoles) {
    console.log(`UserRole ID: ${ur.id} | User: ${ur.user?.email} | Role: ${ur.role?.name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
