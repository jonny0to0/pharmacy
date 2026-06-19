import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const perms = await prisma.permission.findMany();
    console.log(perms.map(p => p.name));
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=check-perms.js.map