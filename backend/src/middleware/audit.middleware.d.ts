import type { Request, Response, NextFunction } from "express";
export declare const auditLog: (action: string, module: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=audit.middleware.d.ts.map