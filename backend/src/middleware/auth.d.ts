import type { Request, Response, NextFunction } from "express";
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
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const authorizeRoles: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Enterprise-Grade Permission Middleware
 * Supports both specific permissions and "Scope" (FULL/LIMITED)
 */
export declare const authorizePermission: (permission: string, requiredScope?: "FULL" | "LIMITED") => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Sensitive Endpoint Rate Limiter
 */
export declare const sensitiveActionsLimiter: import("express-rate-limit").RateLimitRequestHandler;
export {};
//# sourceMappingURL=auth.d.ts.map