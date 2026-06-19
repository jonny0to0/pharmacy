import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    console.log("Fixing Admin User and Tenant relationship...");
    // 1. Find or create the default tenant
    let tenant = await prisma.tenant.findFirst({
        where: { businessName: "Medisynex Pharmacy" }
    });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                businessName: "Medisynex Pharmacy",
                businessType: "PHARMACY",
                isSetupCompleted: true,
            }
        });
    }
    // 2. Ensure Tenant has Settings and Profile
    await prisma.tenantSettings.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            businessProfileCompleted: true,
            taxCompleted: true,
            invoiceCompleted: true,
            notificationCompleted: true,
            enableMedicalInfo: true,
        }
    });
    await prisma.businessProfile.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            businessName: tenant.businessName,
            ownerName: "System Administrator",
            email: "admin@system.com",
        }
    });
    await prisma.taxSettings.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            gstNumber: "27AAAAA0000A1Z5",
            invoicePrefix: "INV-",
        }
    });
    // 3. Link Admin User to this Tenant
    const adminEmail = "admin@system.com";
    const user = await prisma.user.findUnique({
        where: { email: adminEmail }
    });
    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { tenantId: tenant.id }
        });
        console.log(`Linked user ${adminEmail} to tenant ${tenant.businessName}`);
    }
    else {
        console.log("Admin user not found. Please run rbac.ts seed first.");
    }
    console.log("Admin and Tenant initialization complete.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=init_admin.js.map