import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
dotenv.config();
const setupPrisma = () => {
    return new PrismaClient();
};
const prisma = setupPrisma();
async function main() {
    console.log("🛠️ Starting System Bootstrap...");
    // 1. Create System Modules
    const modules = ["Subscriptions", "Users", "Tenants", "Inventory", "Sales", "Reports"];
    for (const name of modules) {
        await prisma.module.upsert({
            where: { name },
            update: {},
            create: { id: randomUUID(), name }
        });
    }
    // 2. Create Core Permissions
    const permissions = [
        { name: "manage_subscriptions", action: "FULL", moduleName: "Subscriptions" },
        { name: "view_subscriptions", action: "READ", moduleName: "Subscriptions" },
        { name: "manage_users", action: "FULL", moduleName: "Users" },
        { name: "manage_tenants", action: "FULL", moduleName: "Tenants" },
        { name: "view_dashboard", action: "READ", moduleName: "Reports" }
    ];
    for (const perm of permissions) {
        const mod = await prisma.module.findUnique({ where: { name: perm.moduleName } });
        if (!mod)
            continue;
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: { moduleId: mod.id },
            create: { id: randomUUID(), name: perm.name, action: perm.action, moduleId: mod.id }
        });
    }
    // 3. Create System Roles (Using findFirst/create to avoid unique null issues in upsert)
    const ensureSystemRole = async (name, description) => {
        let role = await prisma.role.findFirst({
            where: { name, tenantId: null }
        });
        if (!role) {
            role = await prisma.role.create({
                data: { id: randomUUID(), name, description: description, isSystem: true, tenantId: null, updatedAt: new Date() }
            });
        }
        return role;
    };
    const superAdminRole = await ensureSystemRole("SUPER_ADMIN", "Platform Overlord");
    await ensureSystemRole("BUSINESS_ADMIN", "Tenant Owner");
    // 4. Link all permissions to Super Admin
    const allPerms = await prisma.permission.findMany();
    for (const perm of allPerms) {
        const existing = await prisma.rolepermission.findUnique({
            where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } }
        });
        if (!existing) {
            await prisma.rolepermission.create({
                data: { id: randomUUID(), roleId: superAdminRole.id, permissionId: perm.id, scope: "FULL" }
            });
        }
    }
    // 5. Create Super Admin User
    const email = "admin@medisynex.com";
    const password = "Admin@123";
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword, role: "SUPER_ADMIN", status: "ACTIVE" },
        create: {
            id: randomUUID(),
            name: "Super Admin",
            email,
            mobile: "9999999999",
            password: hashedPassword,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            isActive: true,
            updatedAt: new Date()
        }
    });
    // 6. Assign Role to User
    const existingUserRole = await prisma.userrole.findUnique({
        where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } }
    });
    if (!existingUserRole) {
        await prisma.userrole.create({
            data: { id: randomUUID(), userId: admin.id, roleId: superAdminRole.id, updatedAt: new Date() }
        });
    }
    console.log(`
🏁 System Boostrapped Successfully!
-----------------------------------
Super Admin Login:
Email: ${email}
Password: ${password}
-----------------------------------
`);
}
main()
    .catch(console.error)
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=bootstrap-system.js.map