import type { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            allowedBranchIds?: string[];
        }
    }
}
export declare const checkBranchRestriction: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=branch.middleware.d.ts.map