/**
 * Tenant Middleware (Golden Rule Enforcer)
 * Ensures that any non-Super Admin user has a valid tenantId (businessId)
 * before accessing multi-tenant routes.
 */
export const enforceTenantScope = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const isSuperAdmin = req.user.roles.includes("SUPER_ADMIN");
    if (!isSuperAdmin && !req.user.tenantId) {
        return res.status(403).json({
            error: "Business context missing. Please select a business.",
            code: "MISSING_TENANT"
        });
    }
    next();
};
//# sourceMappingURL=tenant.middleware.js.map