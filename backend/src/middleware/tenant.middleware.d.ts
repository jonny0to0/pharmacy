import type { Request, Response, NextFunction } from "express";
/**
 * Tenant Middleware (Golden Rule Enforcer)
 * Ensures that any non-Super Admin user has a valid tenantId (businessId)
 * before accessing multi-tenant routes.
 */
export declare const enforceTenantScope: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=tenant.middleware.d.ts.map