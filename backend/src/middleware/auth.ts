import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import { rateLimit } from "express-rate-limit";
import { GeoService } from "../services/GeoService.js";
import { DeviceService } from "../services/DeviceService.js";
import { SECURITY_THRESHOLDS, TRUSTED_DEVICE_CONFIG } from "../config/security.js";
import { AlertingService } from "../services/AlertingService.js";

interface JwtPayload {
  userId: string;
  roles: string[];
  tenantId: string | null;
  isImpersonating?: boolean;
  originalAdminId?: string;
  scope?: 'FULL' | 'LIMITED';
  needsStepUp?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided", code: "TOKEN_MISSING" });
  }

  try {
    const secret = process.env.JWT_SECRET || "default_secret";
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // session check
    if (!decoded.isImpersonating) {
        const session = await prisma.session.findFirst({
            where: { userId: decoded.userId }
        });
        if (!session) {
            return res.status(401).json({ error: "Session invalid", code: "SESSION_INVALID" });
        }
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: "User not found" });

    // --- 1. TRUSTED DEVICE CHECK ---
    const deviceToken = req.cookies?.[TRUSTED_DEVICE_CONFIG.COOKIE_NAME];
    const isDeviceTrusted = deviceToken ? await DeviceService.verifyDevice(user.id, deviceToken) : false;

    // --- 2. GEO-VELOCITY & IP ANOMALY DETECTION ---
    let needsStepUp = false;
    const currentIp = req.ip;
    const isPrivileged = decoded.roles.includes('SUPER_ADMIN') || decoded.roles.includes('ADMIN');
    
    // Simulate current geo-location
    const geoHint = req.header('x-geo-hint') || 'INDIA';
    const currentGeo = GeoService.mockLookup(geoHint);
    const now = new Date(); // STRICTLY SERVER-SIDE TIMESTAMP

    if (isPrivileged && user.lastGeoLat && user.lastGeoLon && user.lastGeoTimestamp) {
        const { isImpossible, speed, risk } = GeoService.checkImpossibleTravel(
            { lat: user.lastGeoLat, lon: user.lastGeoLon, timestamp: user.lastGeoTimestamp },
            { lat: currentGeo.lat, lon: currentGeo.lon, timestamp: now }
        );

        if (risk === 'HIGH') {
            const msg = `🚨 [IMPOSSIBLE TRAVEL] Admin ${user.email} detected at ${geoHint}. Speed: ${speed} km/h.`;
            console.error(msg);
            
            // Only skip step-up for medium risk if trusted. High risk ALWAYS steps up.
            needsStepUp = true; 
            await AlertingService.notify(msg, "CRITICAL", `GEO_BREACH_${user.id}`);
        } else if (risk === 'MEDIUM') {
            if (!isDeviceTrusted) {
               console.warn(`🕵️ [SECURITY] Unrecognized device at new region for ${user.email} (${geoHint}). Step-up forced.`);
               needsStepUp = true; 
            } else {
               console.log(`📡 [SECURITY] Recognized device for ${user.email} at new region (${geoHint}). Proceeding without friction.`);
            }
        }
    }

    // IP Anomaly Fallback (Legacy)
    if (isPrivileged && !needsStepUp && user.lastKnownIp && user.lastKnownIp !== currentIp) {
        needsStepUp = true;
        await AlertingService.notify(
          `⚠️ [SESSIONS] New IP detected for Admin ${user.email}: ${currentIp}`,
          "WARNING",
          `NEW_IP_${user.id}`
        );
    }

    // Update Telemetry in DB
    prisma.user.update({ 
        where: { id: user.id }, 
        data: { 
            lastKnownIp: currentIp,
            lastGeoLat: currentGeo.lat,
            lastGeoLon: currentGeo.lon,
            lastGeoTimestamp: now
        } 
    }).catch(e => {});

    req.user = {
      userId: decoded.userId,
      roles: decoded.roles,
      tenantId: decoded.tenantId,
      isImpersonating: decoded.isImpersonating,
      originalAdminId: decoded.originalAdminId,
      scope: decoded.scope || 'FULL',
      needsStepUp
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: "Access token expired", code: "TOKEN_EXPIRED" });
    }
    res.status(401).json({ success: false, error: "Invalid token", code: "TOKEN_INVALID" });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roles.some(role => allowedRoles.includes(role))) {
      return res.status(403).json({ success: false, error: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

/**
 * Enterprise-Grade Permission Middleware
 * Supports both specific permissions and "Scope" (FULL/LIMITED)
 */
export const authorizePermission = (permission: string, requiredScope: 'FULL' | 'LIMITED' = 'LIMITED') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    // 🔒 Impersonation Guardrail: Block write actions on sensitive modules
    const isWriteAction = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    const moduleName = permission.split("_").pop()?.toUpperCase() || "";
    const isSensitiveModule = ["BILLING", "PAYMENTS", "INTEGRATIONS", "RBAC", "PLOTS", "SYSTEM"].includes(moduleName);

    if (req.user.isImpersonating && isWriteAction && (isSensitiveModule || permission.includes("manage"))) {
      return res.status(403).json({ 
        success: false, 
        error: "Support Mode: Write operations are strictly forbidden for administrative safety." 
      });
    }

    // 1. Fetch user permissions and their scopes from DB
    const userWithRoles = await prisma.user.findUnique({
      where: { id: req.user.userId },
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

    if (!userWithRoles) return res.status(403).json({ success: false, error: "User not found" });

    // 2. Check for the permission
    let hasPerm = false;
    let effectiveScope: 'FULL' | 'LIMITED' = 'LIMITED';

    for (const ur of userWithRoles.userrole) {
      const rolePerm = ur.role.rolepermission.find(rp => rp.permission.name === permission);
      if (rolePerm) {
        hasPerm = true;
        // If any role grants FULL scope, the user has FULL scope for this permission
        if (rolePerm.scope === 'FULL') {
          effectiveScope = 'FULL';
        }
      }
    }

    // 3. Special case for SUPER_ADMIN (Root override)
    if (req.user.roles.includes('SUPER_ADMIN')) {
      hasPerm = true;
      effectiveScope = 'FULL';
    }

    if (!hasPerm) {
      return res.status(403).json({ success: false, error: `Permission denied: ${permission} required.` });
    }

    if (requiredScope === 'FULL' && effectiveScope !== 'FULL') {
      return res.status(403).json({ success: false, error: `Insufficient scope: FULL access required for ${permission}.` });
    }

    next();
  };
};

/**
 * Sensitive Endpoint Rate Limiter
 */
export const sensitiveActionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: { error: "Too many attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});
