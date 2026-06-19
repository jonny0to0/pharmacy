import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
const prisma = new PrismaClient();
const MODULES = [
    "DASHBOARD",
    "STAFF",
    "ROLES",
    "TENANTS",
    "PRODUCTS",
    "CUSTOMERS",
    "SUPPLIERS",
    "SALES",
    "PURCHASES",
    "EXPENSES",
    "PAYMENTS",
    "REPORTS",
    "SETTINGS",
    "SETTINGS_BUSINESS",
    "SETTINGS_OPERATIONAL",
    "AUDIT_LOGS",
];
const ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE", "UPDATE_MASTER"];
async function main() {
    console.log("Starting RBAC seeding...");
    // 1. Create Modules and Permissions (Idempotent)
    for (const moduleName of MODULES) {
        const module = await prisma.module.upsert({
            where: { name: moduleName },
            update: {},
            create: { id: randomUUID(), name: moduleName },
        });
        for (const action of ACTIONS) {
            const permissionName = `${moduleName}.${action}`;
            await prisma.permission.upsert({
                where: { name: permissionName },
                update: { moduleId: module.id, action },
                create: {
                    id: randomUUID(),
                    name: permissionName,
                    action,
                    moduleId: module.id,
                },
            });
        }
    }
    console.log("Modules and Permissions seeded.");
    // 2. Create System Roles (Idempotent)
    const systemRoles = [
        {
            name: "SUPER_ADMIN",
            description: "Full system access across all tenants",
            isSystem: true,
        },
        {
            name: "BUSINESS_ADMIN",
            description: "Full access to business operations",
            isSystem: true,
        },
        {
            name: "MANAGER",
            description: "Manage inventory, sales and reports",
            isSystem: true,
        },
        {
            name: "CASHIER",
            description: "Point of Sale operations",
            isSystem: true,
        },
        {
            name: "PHARMACIST",
            description: "Manage medicine inventory and dispensing",
            isSystem: true,
        },
    ];
    for (const roleData of systemRoles) {
        const existingRole = await prisma.role.findFirst({
            where: {
                name: roleData.name,
                tenantId: null,
                isSystem: true
            }
        });
        if (existingRole) {
            await prisma.role.update({
                where: { id: existingRole.id },
                data: { description: roleData.description }
            });
            console.log(`Updated system role: ${roleData.name}`);
        }
        else {
            await prisma.role.create({
                data: {
                    id: randomUUID(),
                    name: roleData.name,
                    description: roleData.description,
                    isSystem: true,
                    tenantId: null,
                    updatedAt: new Date()
                }
            });
            console.log(`Created system role: ${roleData.name}`);
        }
    }
    console.log("System Roles seeded.");
    // 3. Map Permissions to Roles (Idempotent)
    const allPermissions = await prisma.permission.findMany();
    // SUPER_ADMIN & BUSINESS_ADMIN get everything
    const adminRoles = await prisma.role.findMany({
        where: {
            name: { in: ["SUPER_ADMIN", "BUSINESS_ADMIN"] },
            isSystem: true,
            tenantId: null
        },
    });
    for (const role of adminRoles) {
        for (const perm of allPermissions) {
            await prisma.rolepermission.upsert({
                where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
                update: {},
                create: { id: randomUUID(), roleId: role.id, permissionId: perm.id },
            });
        }
    }
    // 4. MANAGER permissions
    const managerRole = await prisma.role.findFirst({ where: { name: "MANAGER", isSystem: true, tenantId: null } });
    if (managerRole) {
        const managerPerms = allPermissions.filter((p) => p.name.includes("READ") ||
            p.name.includes("SALES.CREATE") ||
            p.name.includes("PRODUCTS") ||
            p.name.includes("CUSTOMERS") ||
            p.name.includes("SUPPLIERS") ||
            p.name.includes("EXPENSES") ||
            p.name.startsWith("SETTINGS_OPERATIONAL"));
        for (const perm of managerPerms) {
            await prisma.rolepermission.upsert({
                where: { roleId_permissionId: { roleId: managerRole.id, permissionId: perm.id } },
                update: {},
                create: { id: randomUUID(), roleId: managerRole.id, permissionId: perm.id },
            });
        }
    }
    // 5. CASHIER permissions
    const cashierRole = await prisma.role.findFirst({ where: { name: "CASHIER", isSystem: true, tenantId: null } });
    if (cashierRole) {
        const cashierPerms = allPermissions.filter((p) => p.name === "DASHBOARD.READ" ||
            p.name.startsWith("SALES") ||
            p.name.startsWith("CUSTOMERS"));
        for (const perm of cashierPerms) {
            await prisma.rolepermission.upsert({
                where: { roleId_permissionId: { roleId: cashierRole.id, permissionId: perm.id } },
                update: {},
                create: { id: randomUUID(), roleId: cashierRole.id, permissionId: perm.id },
            });
        }
    }
    // 6. PHARMACIST permissions
    const pharmacistRole = await prisma.role.findFirst({ where: { name: "PHARMACIST", isSystem: true, tenantId: null } });
    if (pharmacistRole) {
        const pharmacistPerms = allPermissions.filter((p) => p.name === "DASHBOARD.READ" ||
            (p.name.startsWith("PRODUCTS") && !p.name.includes("CREATE")) ||
            p.name.startsWith("SALES") ||
            p.name.startsWith("CUSTOMERS"));
        for (const perm of pharmacistPerms) {
            await prisma.rolepermission.upsert({
                where: { roleId_permissionId: { roleId: pharmacistRole.id, permissionId: perm.id } },
                update: {},
                create: { id: randomUUID(), roleId: pharmacistRole.id, permissionId: perm.id },
            });
        }
    }
    // 7. Create a default SUPER_ADMIN user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    const adminEmail = "admin@system.com";
    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { password: hashedPassword, role: "SUPER_ADMIN" },
        create: {
            id: randomUUID(),
            name: "System Admin",
            email: adminEmail,
            mobile: "0000000000",
            password: hashedPassword,
            role: "SUPER_ADMIN",
            updatedAt: new Date()
        },
    });
    // Assign SUPER_ADMIN role to the user
    const superAdminRole = await prisma.role.findFirst({
        where: { name: "SUPER_ADMIN", isSystem: true, tenantId: null },
    });
    if (superAdminRole) {
        await prisma.userrole.upsert({
            where: {
                userId_roleId: {
                    userId: user.id,
                    roleId: superAdminRole.id,
                },
            },
            update: {},
            create: {
                id: randomUUID(),
                userId: user.id,
                roleId: superAdminRole.id,
            },
        });
    }
    console.log("Default Admin user created: admin@system.com / admin123");
    console.log("RBAC seeding completed successfully.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=rbac.js.map