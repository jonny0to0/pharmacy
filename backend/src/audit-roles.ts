import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Roles and Permissions ---');
  
  const roles = await prisma.role.findMany({
    include: {
      rolepermission: {
        include: {
          permission: true
        }
      }
    }
  });

  roles.forEach(role => {
    console.log(`Role: ${role.name} (Tenant: ${role.tenantId || 'GLOBAL'})`);
    role.rolepermission.forEach(rp => {
      console.log(`  - ${rp.permission.name}`);
    });
  });

  console.log('\n--- Checking Users and their Roles ---');
  const users = await prisma.user.findMany({
    include: {
      userrole: {
        include: {
          role: true
        }
      }
    }
  });

  users.forEach(user => {
    console.log(`User: ${user.name} (${user.email})`);
    user.userrole.forEach(ur => {
      console.log(`  - ${ur.role.name}`);
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
