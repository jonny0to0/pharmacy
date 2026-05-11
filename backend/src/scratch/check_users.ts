import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  try {
    const tenants = await prisma.tenant.count();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, tenantId: true }
    });
    console.log(`Tenants: ${tenants}`);
    console.log("Users:");
    console.table(users);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
