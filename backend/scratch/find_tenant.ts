
import prisma from '../src/db.js';

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { isSetupCompleted: false },
    include: { user: true }
  });

  if (!tenant) {
    console.log('No tenant found needing setup.');
    return;
  }

  console.log('Found Tenant:', tenant.id);
  console.log('Admin User:', tenant.user[0]?.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
