import { Request, Response, NextFunction } from "express";
/**
 * Middleware to check if the current tenant's plan allows a specific feature
 */
export declare const checkFeature: (featureKey: string) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Utility to check a limit (to be used inside route handlers)
 */
export declare const checkLimit: (tenantId: string, limitKey: string, currentCount: number) => Promise<boolean>;
//# sourceMappingURL=plan.middleware.d.ts.map