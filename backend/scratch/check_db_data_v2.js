import { basePrisma } from '../src/db.ts';
async function main() {
    try {
        const freePlan = await basePrisma.plan.findFirst({
            where: { code: 'FREE' }
        });
        console.log('FREE Plan exists:', !!freePlan);
        if (freePlan)
            console.log(JSON.stringify(freePlan, null, 2));
        const businessAdminRole = await basePrisma.role.findFirst({
            where: { name: 'BUSINESS_ADMIN', tenantId: null }
        });
        console.log('BUSINESS_ADMIN Role exists:', !!businessAdminRole);
        if (businessAdminRole)
            console.log(JSON.stringify(businessAdminRole, null, 2));
        const allRoles = await basePrisma.role.findMany();
        console.log('All Roles:', allRoles.map(r => r.name));
    }
    catch (err) {
        console.error('Error during DB check:', err);
    }
    finally {
        await basePrisma.$disconnect();
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=check_db_data_v2.js.map