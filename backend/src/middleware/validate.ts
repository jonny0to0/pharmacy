import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as any;
      req.body = parsed.body;
      
      // Express 5 defines req.query and req.params with getters, so we cannot reassign them.
      // Instead, we clear the existing object's properties and merge the parsed Zod values.
      if (parsed.query) {
        Object.keys(req.query).forEach(k => delete req.query[k as keyof typeof req.query]);
        Object.assign(req.query, parsed.query);
      }
      
      if (parsed.params) {
        Object.keys(req.params).forEach(k => delete req.params[k as keyof typeof req.params]);
        Object.assign(req.params, parsed.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.warn(`[VALIDATION_FAILED] ${req.method} ${req.url}:`, error.issues);
        res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((e: any) => ({ path: e.path.join('.'), message: e.message }))
        });
        return;
      }
      next(error);
    }
  };
};
