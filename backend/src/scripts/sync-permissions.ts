import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_PERMISSIONS = [
  { name: '', action: 'READ', module: 'USERS' },
  { name: 'STAFF.CREATE', action: 'CREATE', module: 'USERS' },
  { name: 'STAFF.UPDATE', action: 'UPDATE', module: 'USERS' },
  { name: 'STAFF.DELETE', action: 'DELETE', module: 'USERS' },
];

async function main() {
  console.log('--- Syncing Staff Permissions ---');

  // 1. Ensure Module exists
  const userModule = await prisma.module.upsert({
    where: { name: 'USERS' },
    update: {},
    create: { name: 'USERS' },
  });

  // 2. Upsert Permissions
  const permissionIds: string[] = [];
  for (const p of ADMIN_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { name: p.name },
      update: { action: p.action, moduleId: userModule.id },
      create: { name: p.name, action: p.action, moduleId: userModule.id },
    });
    permissionIds.push(permission.id);
    console.log(`Permission ensured: ${p.name}`);
  }

  // 3. Link to BUSINESS_ADMIN and MANAGER roles
  const rolesToUpdate = await prisma.role.findMany({
    where: {
      name: { in: ['BUSINESS_ADMIN', 'MANAGER'] }
    }
  });

  for (const role of rolesToUpdate) {
    console.log(`Linking permissions to role: ${role.name}`);
    for (const pId of permissionIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: pId
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: pId
        }
      });
    }
  }

  // 4. Clear Cache
  console.log('Clearing permission cache...');
  await prisma.cacheEntry.deleteMany({
    where: {
      key: { startsWith: 'user_perms:' }
    }
  });

  console.log('--- Sync Completed Successfully ---');
}

main()
  .catch(e => {
    console.error('Sync failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
