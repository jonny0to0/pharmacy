import { Request, Response, NextFunction } from "express";
import { PlanService } from "../services/PlanService.js";

/**
 * Middleware to check if the current tenant's plan allows a specific feature
 */
export const checkFeature = (featureKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(403).json({ error: "Tenant context required" });

      const snapshot = await PlanService.getTenantPlanSnapshot(tenantId);
      
      // Allow if it's a Super Admin (Global Access)
      const isSuperAdmin = req.user?.roles?.some((r: any) => 
        (typeof r === 'string' ? r : r.role?.name) === "SUPER_ADMIN"
      );
      if (isSuperAdmin) return next();

      if (!snapshot) {
          return res.status(403).json({ error: "No active subscription found. Please subscribe to a plan." });
      }

      if (snapshot.features[featureKey] !== true) {
        return res.status(403).json({ 
          success: false,
          error: `Feature ${featureKey} is not available in your current plan.`,
          code: "FEATURE_LOCKED",
          requiredFeature: featureKey
        });
      }

      next();
    } catch (error) {
      console.error(`[Plan Middleware] Feature Check Error (${featureKey}):`, error);
      res.status(500).json({ error: "Internal server error during plan verification" });
    }
  };
};

/**
 * Utility to check a limit (to be used inside route handlers)
 */
export const checkLimit = async (tenantId: string, limitKey: string, currentCount: number) => {
    const snapshot = await PlanService.getTenantPlanSnapshot(tenantId);
    if (!snapshot) throw new Error("No active subscription found");

    const limit = snapshot.limits[limitKey];
    
    // If limit is -1 or null, it's unlimited
    if (limit === undefined || limit === null || limit === -1) return true;

    if (currentCount >= limit) {
        const error: any = new Error(`Limit reached for ${limitKey}. Current: ${currentCount}, Max: ${limit}`);
        error.code = "LIMIT_EXCEEDED";
        error.limitKey = limitKey;
        error.limitValue = limit;
        error.currentValue = currentCount;
        throw error;
    }

    return true;
};
