import express, {} from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { auditLog } from "../middleware/audit.middleware.js";
import { cacheService } from "../services/cache.service.js";
import { randomUUID } from "crypto";
const router = express.Router();
// Get all roles for the current tenant + global system roles
router.get("/", authenticateToken, requirePermission("ROLES.READ"), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const roles = await prisma.role.findMany({
            where: {
                OR: [
                    { tenantId },
                    { isSystem: true, tenantId: null }
                ]
            },
            include: {
                rolepermission: {
                    include: {
                        permission: true
                    }
                }
            }
        });
        // Map to maintain API compatibility
        const mappedRoles = roles.map(r => ({
            ...r,
            permissions: r.rolepermission
        }));
        res.json(mappedRoles);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch roles" });
    }
});
// Create a new custom role
router.post("/", authenticateToken, requirePermission("ROLES.CREATE"), auditLog("CREATE_ROLE", "ROLES"), async (req, res) => {
    try {
        const { name, description, permissionIds = [] } = req.body;
        const tenantId = req.user.tenantId;
        if (!tenantId)
            return res.status(400).json({ error: "Tenant ID required" });
        const role = await prisma.role.create({
            data: {
                id: randomUUID(),
                name,
                description,
                tenantId,
                isSystem: false,
                updatedAt: new Date(),
                rolepermission: {
                    create: permissionIds.map((pId) => ({
                        id: randomUUID(),
                        permissionId: pId
                    }))
                }
            }
        });
        res.json(role);
    }
    catch (error) {
        console.error("Role creation error:", error);
        res.status(500).json({ error: "Failed to create role" });
    }
});
// Update role permissions
const updatePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissionIds } = req.body;
        const tenantId = req.user.tenantId;
        const role = await prisma.role.findFirst({
            where: { id, OR: [{ tenantId }, { isSystem: true, tenantId: null }] }
        });
        if (!role)
            return res.status(404).json({ error: "Role not found" });
        if (role.isSystem && !req.user.roles.includes("SUPER_ADMIN")) {
            return res.status(403).json({ error: "Cannot modify system roles" });
        }
        // Update permissions (delete old mappings and create new ones)
        await prisma.$transaction([
            prisma.rolepermission.deleteMany({ where: { roleId: id } }),
            prisma.rolepermission.createMany({
                data: permissionIds.map((pId) => ({
                    id: randomUUID(),
                    roleId: id,
                    permissionId: pId
                }))
            })
        ]);
        // INVALIDATE CACHE for all users with this role
        const usersWithRole = await prisma.userrole.findMany({
            where: { roleId: id },
            select: { userId: true }
        });
        for (const u of usersWithRole) {
            await cacheService.delete(`user_perms:${u.userId}`);
        }
        res.json({ message: "Permissions updated successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update permissions" });
    }
};
router.patch("/:id/permissions", authenticateToken, requirePermission("ROLES.UPDATE"), auditLog("UPDATE_ROLE_PERMISSIONS", "ROLES"), updatePermissions);
router.put("/:id/permissions", authenticateToken, requirePermission("ROLES.UPDATE"), auditLog("UPDATE_ROLE_PERMISSIONS", "ROLES"), updatePermissions);
// Get all available permissions grouped by module
router.get("/permissions", authenticateToken, requirePermission("ROLES.READ"), async (req, res) => {
    try {
        const modules = await prisma.module.findMany({
            include: {
                permission: true
            }
        });
        const mappedModules = modules.map((m) => ({
            ...m,
            permissions: m.permission,
            permission: undefined
        }));
        res.json(mappedModules);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch permissions" });
    }
});
// Update custom role details (name and description)
router.put("/:id", authenticateToken, requirePermission("ROLES.UPDATE"), auditLog("UPDATE_ROLE", "ROLES"), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const tenantId = req.user.tenantId;
        const role = await prisma.role.findFirst({
            where: { id, tenantId, isSystem: false }
        });
        if (!role)
            return res.status(404).json({ error: "Custom role not found" });
        if (!name)
            return res.status(400).json({ error: "Role name is required" });
        // Check if name is changed and if new name is already taken for this tenant
        if (name.toUpperCase() !== role.name.toUpperCase()) {
            const existing = await prisma.role.findFirst({
                where: {
                    name: name.toUpperCase(),
                    tenantId
                }
            });
            if (existing) {
                return res.status(400).json({ error: "A custom role with this name already exists" });
            }
        }
        const updated = await prisma.role.update({
            where: { id },
            data: {
                name: name.toUpperCase(),
                description,
                updatedAt: new Date()
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error("Role update error:", error);
        res.status(500).json({ error: "Failed to update role details" });
    }
});
// Delete a custom role
router.delete("/:id", authenticateToken, requirePermission("ROLES.DELETE"), auditLog("DELETE_ROLE", "ROLES"), async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;
        const role = await prisma.role.findFirst({
            where: { id, tenantId, isSystem: false }
        });
        if (!role)
            return res.status(404).json({ error: "Custom role not found" });
        // Check if there are users currently assigned to this role
        const usersWithRole = await prisma.userrole.count({
            where: { roleId: id }
        });
        if (usersWithRole > 0) {
            return res.status(400).json({ error: "Cannot delete role. There are users currently assigned to this role." });
        }
        // Delete role-permissions and the role in a transaction
        await prisma.$transaction([
            prisma.rolepermission.deleteMany({ where: { roleId: id } }),
            prisma.role.delete({ where: { id } })
        ]);
        res.json({ message: "Role deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete role" });
    }
});
export default router;
//# sourceMappingURL=roles.js.map