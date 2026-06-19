import prisma from '../db.js';
async function main() {
    const users = await prisma.user.findMany({
        include: {
            userrole: {
                include: {
                    role: true
                }
            }
        }
    });
    console.log(JSON.stringify(users, null, 2));
}
main().catch(err => {
    console.error(err);
    process.exit(1);
}).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-users.js.map