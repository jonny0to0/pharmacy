import type { Request, Response, NextFunction } from "express";
import prisma from "../db.js";

import { randomUUID } from "crypto";

export const auditLog = (action: string, module: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const userId = req.user.userId;
        
        prisma.auditlog.create({
          data: {
            id: randomUUID(),
            userId,
            action,
            module,
            entityId: (req.params as any).id || body.id || null,
            metadata: JSON.stringify({
              method: req.method,
              path: req.path,
              query: req.query,
              // We omit body for security/size but could selectively log fields if needed
            })
          }
        }).catch(err => console.error("Audit Log Creation Failed:", err));
      }
      return originalJson.call(this, body);
    };

    next();
  };
};
