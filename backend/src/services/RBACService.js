import prisma from "../db.js";
import { randomUUID } from "crypto";
/**
 * Service to manage system-wide permissions and roles
 */
export class RBACService {
    /**
     * Initializes the ADMIN module and critical permissions
     */
    static async initializeSystemPermissions() {
        console.log("🔐 [RBAC] Initializing system permissions...");
        // 1. Create ADMIN module
        const adminModule = await prisma.module.upsert({
            where: { name: "ADMIN" },
            update: {},
            create: {
                id: randomUUID(),
                name: "ADMIN"
            }
        });
        const permissions = [
            { name: "manage_subscriptions", action: "MANAGE" },
            { name: "manage_flags", action: "MANAGE" },
            { name: "manage_integrations", action: "MANAGE" },
            { name: "manage_platform_settings", action: "MANAGE" },
            { name: "impersonate_user", action: "EXECUTE" },
            { name: "view_audit_logs", action: "READ" },
            { name: "broadcast_notifications", action: "EXECUTE" }
        ];
        for (const perm of permissions) {
            await prisma.permission.upsert({
                where: { name: perm.name },
                update: { moduleId: adminModule.id, action: perm.action },
                create: {
                    id: randomUUID(),
                    name: perm.name,
                    action: perm.action,
                    moduleId: adminModule.id
                }
            });
        }
        console.log("✅ [RBAC] Admin permissions synchronized.");
    }
}
//# sourceMappingURL=RBACService.js.map