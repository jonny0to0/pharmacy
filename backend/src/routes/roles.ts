import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { auditLog } from "../middleware/audit.middleware.js";
import { cacheService } from "../services/cache.service.js";

const router = express.Router();

// Get all roles for the current tenant + global system roles
router.get("/", authenticateToken, requirePermission("ROLES.READ"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
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
      permissions: (r as any).rolepermission
    }));

    res.json(mappedRoles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

// Create a new custom role
router.post("/", authenticateToken, requirePermission("ROLES.CREATE"), auditLog("CREATE_ROLE", "ROLES"), async (req: Request, res: Response) => {
  try {
    const { name, description, permissionIds } = req.body;
    const tenantId = req.user!.tenantId;

    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const role = await prisma.role.create({
      data: {
        name,
        description,
        tenantId,
        isSystem: false,
        rolepermission: {
          create: permissionIds.map((pId: string) => ({
            permissionId: pId
          }))
        }
      }
    });

    res.json(role);
  } catch (error) {
    res.status(500).json({ error: "Failed to create role" });
  }
});

// Update role permissions
router.patch("/:id/permissions", authenticateToken, requirePermission("ROLES.UPDATE"), auditLog("UPDATE_ROLE_PERMISSIONS", "ROLES"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;
    const tenantId = req.user!.tenantId;

    const role = await prisma.role.findFirst({
      where: { id, OR: [{ tenantId }, { isSystem: true, tenantId: null }] }
    });

    if (!role) return res.status(404).json({ error: "Role not found" });
    if (role.isSystem && !req.user!.roles.includes("SUPER_ADMIN")) {
      return res.status(403).json({ error: "Cannot modify system roles" });
    }

    // Update permissions (delete old mappings and create new ones)
    await prisma.$transaction([
      prisma.rolepermission.deleteMany({ where: { roleId: id } }),
      prisma.rolepermission.createMany({
        data: permissionIds.map((pId: string) => ({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update permissions" });
  }
});

// Get all available permissions grouped by module
router.get("/permissions", authenticateToken, requirePermission("ROLES.READ"), async (req: Request, res: Response) => {
  try {
    const modules = await prisma.module.findMany({
      include: {
        permission: true
      }
    });

    const mappedModules = modules.map((m: any) => ({
      ...m,
      permissions: m.permission,
      permission: undefined
    }));

    res.json(mappedModules);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
});

export default router;
