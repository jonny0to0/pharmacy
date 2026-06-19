import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('--- Starting data correction for Super Admin ---');
    try {
        // 1. Find all users with SUPER_ADMIN role
        const superAdmins = await prisma.user.findMany({
            where: {
                role: 'SUPER_ADMIN'
            }
        });
        console.log(`Found ${superAdmins.length} Super Admin(s).`);
        if (superAdmins.length === 0) {
            console.log('No Super Admin found. Please ensure your initial setup script has run.');
        }
        else {
            // 2. Update them to be ACTIVE and NOT invited
            const result = await prisma.user.updateMany({
                where: {
                    role: 'SUPER_ADMIN'
                },
                data: {
                    status: 'ACTIVE',
                    isInvited: false,
                    isActive: true
                }
            });
            console.log(`Successfully updated ${result.count} Super Admin(s) to status: ACTIVE and isInvited: false.`);
        }
        // 3. Optional: Fix Business Admins if they are stuck in PENDING
        const businessAdmins = await prisma.user.updateMany({
            where: {
                role: 'BUSINESS_ADMIN',
                status: 'PENDING'
            },
            data: {
                status: 'ACTIVE',
                isInvited: false
            }
        });
        console.log(`Updated ${businessAdmins.count} Business Admin(s) who were stuck in PENDING.`);
    }
    catch (error) {
        console.error('Error correcting Super Admin data:', error);
    }
    finally {
        await prisma.$disconnect();
    }
    console.log('--- Data correction complete ---');
}
main();
//# sourceMappingURL=fix-superadmin.js.map