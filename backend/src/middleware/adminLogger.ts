import type { Request, Response, NextFunction } from "express";
import { createAuditLog } from "../services/auditService.js";
import { maskObject } from "../utils/masking.js";

/**
 * Middleware to automatically log administrative mutations
 */
export const adminLogger = async (req: Request, res: Response, next: NextFunction) => {
  // Capture original send/json to log after response is sent
  const originalJson = res.json;
  
  res.json = function (data: any) {
    // Only log successful administrative mutations
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    const isAdminPath = req.path.startsWith("/admin") || req.path.includes("/admin/");
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

    if (isMutation && isAdminPath && isSuccess && req.user) {
      const requestId = getRequestId() || req.headers["x-request-id"];
      const pathParts = req.path.split("/");
      const module = pathParts[2]?.toUpperCase() || "ADMIN";
      const action = `${req.method}_${pathParts.pop()?.toUpperCase()}`;

      // 1. Determine Severity based on production guidelines
      let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO";
      if (
        action.includes("IMPERSONATION") || 
        action.includes("ROLE") || 
        action.includes("SETTING") || 
        module === "SUBSCRIPTIONS" ||
        module === "INTEGRATIONS"
      ) {
        severity = "WARNING";
      }

      // 2. Audit Payload Strategy: Keys only for better scalability & security
      const bodyKeys = Object.keys(req.body || {});
      const metadata: any = {
        path: req.path,
        method: req.method,
        query: req.query,
        bodyKeys: bodyKeys,
        status: res.statusCode
      };

      // Store diff hint for specific modules
      if (module === "SETTINGS" || module === "FEATURE-FLAGS") {
        metadata.changeHint = "Configuration Update";
      }

      // 3. PII Scrubbing: Mask sensitive query params or metadata
      const sanitizedMetadata = maskObject(metadata);

      // Fire and forget logging (using hash-chained service)
      createAuditLog(
        req.user.userId,
        module,
        action,
        undefined, // targetId (optional)
        sanitizedMetadata,
        severity,
        req.ip,
        req.user.isImpersonating ? req.user.originalAdminId : undefined
      ).catch(err => {
        console.error("Failed to create admin audit log:", err);
      });
    }

    return originalJson.call(this, data);
  };

  next();
};
