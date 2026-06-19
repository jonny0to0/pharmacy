import { ZodError } from "zod";
export const validate = (schema) => {
    return (req, res, next) => {
        try {
            const parsed = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            req.body = parsed.body;
            // Express 5 defines req.query and req.params with getters, so we cannot reassign them.
            // Instead, we clear the existing object's properties and merge the parsed Zod values.
            if (parsed.query) {
                Object.keys(req.query).forEach(k => delete req.query[k]);
                Object.assign(req.query, parsed.query);
            }
            if (parsed.params) {
                Object.keys(req.params).forEach(k => delete req.params[k]);
                Object.assign(req.params, parsed.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                console.warn(`[VALIDATION_FAILED] ${req.method} ${req.url}:`, error.issues);
                res.status(400).json({
                    error: "Validation failed",
                    details: error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
                });
                return;
            }
            next(error);
        }
    };
};
//# sourceMappingURL=validate.js.map