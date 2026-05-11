import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  for (const user of users) {
    console.log(`User: ${user.email}`);
    console.log(`Roles: ${user.roles.map(ur => ur.role.name).join(', ')}`);
    const perms = user.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.name));
    console.log(`Permissions Count: ${perms.length}`);
    if (perms.length > 0) {
      console.log(`Sample Perms: ${perms.slice(0, 5).join(', ')}`);
    }
    console.log('---');
  }
}

check();
