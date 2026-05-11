import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

export const correlationContext = new AsyncLocalStorage<string>();

/**
 * Middleware to generate and propagate correlation IDs (RequestId)
 */
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header('x-request-id') || uuidv4();
  
  // Set in response header for auditability
  res.setHeader('x-request-id', requestId);
  (req as any).id = requestId;
  
  // Run subsequent operations in this context
  correlationContext.run(requestId, () => {
    next();
  });
};

/**
 * Utility to retrieve current request's correlation ID
 */
export const getRequestId = () => {
  return correlationContext.getStore();
};
