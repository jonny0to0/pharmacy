import type { Request, Response, NextFunction } from "express";
import { AlertingService } from "../services/AlertingService.js";

// Error rate tracking memory
const errorMetrics = {
  counts: [] as number[],
  lastFlush: Date.now()
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.status || 500;
  const message = err.message || "Internal server error";

  // Track error
  errorMetrics.counts.push(Date.now());
  
  // Analyze Rate (Sliding window 5 minutes)
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  errorMetrics.counts = errorMetrics.counts.filter(t => now - t < windowMs);

  if (errorMetrics.counts.length > 50 && now - errorMetrics.lastFlush > 60000) {
    // Spike detected (e.g. > 50 errors in 5 mins)
    AlertingService.notify(`🚨 [ERROR_SPIKE] ${errorMetrics.counts.length} errors detected in the last 5 minutes. Last error: ${message}`, "CRITICAL");
    errorMetrics.lastFlush = now;
  }

  // Log to console (production would use a logger like Winston/Pino)
  if (statusCode >= 500) {
    console.error(`[CRITICAL_ERROR] ${req.method} ${req.url}:`, err);
    // Silent alert for developers
    AlertingService.notify(`Error 500 at ${req.method} ${req.url}: ${message}`, "WARNING");
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
