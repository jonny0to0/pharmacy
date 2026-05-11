import type { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import { cacheService } from "../services/cache.service.js";
import { createAuditLog } from "../services/auditService.js";

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, tenantId } = req.user;

    try {
      // 1. Check Cache
      const cacheKey = `user_perms:${userId}`;
      let permissions = await cacheService.get<string[]>(cacheKey);

      if (!permissions) {
        // 2. Fetch from DB with flattened permissions
        const userWithRoles = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            userrole: {
              include: {
                role: {
                  include: {
                    rolepermission: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (!userWithRoles) {
          return res.status(401).json({ error: "User not found" });
        }

        permissions = userWithRoles.userrole.flatMap(ur => 
          ur.role.rolepermission.map(rp => rp.permission.name)
        );

        // Store in Cache (TTL 10 mins)
        await cacheService.set(cacheKey, permissions, 600);
      }

      // 3. Deny-by-Default Policy (with Super Admin and Business Admin bypass)
      const hasPermission = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("BUSINESS_ADMIN") || permissions.includes(permission) || permissions.includes("ALL_ACCESS");
      
      if (!hasPermission) {
        // Log unauthorized attempt
        await createAuditLog(
          userId,
          "SECURITY",
          "UNAUTHORIZED_ACCESS_ATTEMPT",
          tenantId,
          { 
            attemptedPermission: permission,
            path: req.originalUrl,
            method: req.method,
            ip: req.ip
          }
        );

        console.warn(`[SECURITY] Unauthorized access attempt by user ${userId} to ${permission}`);
        return res.status(403).json({ error: `Forbidden: Missing permission ${permission}` });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Internal server error during authorization" });
    }
  };
};
