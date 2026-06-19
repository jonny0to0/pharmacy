import { AsyncLocalStorage } from 'async_hooks';
import type { Request, Response, NextFunction } from 'express';
export declare const correlationContext: AsyncLocalStorage<string>;
/**
 * Middleware to generate and propagate correlation IDs (RequestId)
 */
export declare const correlationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Utility to retrieve current request's correlation ID
 */
export declare const getRequestId: () => string | undefined;
//# sourceMappingURL=correlation.d.ts.map