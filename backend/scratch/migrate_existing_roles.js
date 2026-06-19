import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    console.log("Starting user.role synchronization...");
    // Fetch all users with their dynamic roles
    const users = await prisma.user.findMany({
        include: {
            userrole: {
                include: {
                    role: true
                }
            }
        }
    });
    for (const user of users) {
        if (user.userrole.length > 0) {
            // Get the first assigned role name
            const dynamicRole = user.userrole[0].role.name;
            if (user.role !== dynamicRole) {
                console.log(`Syncing user "${user.name}" (${user.email}): "${user.role}" -> "${dynamicRole}"`);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: dynamicRole }
                });
            }
            else {
                console.log(`User "${user.name}" (${user.email}) is already synced with role "${dynamicRole}".`);
            }
        }
        else {
            console.log(`User "${user.name}" (${user.email}) has no assigned dynamic role.`);
        }
    }
    console.log("Synchronization completed successfully!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=migrate_existing_roles.js.map