import prisma from "../db.js";
export const checkBranchRestriction = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const { userId, roles } = req.user;
    // SUPER_ADMIN and BUSINESS_ADMIN bypass branch restrictions
    if (roles.includes("SUPER_ADMIN") || roles.includes("BUSINESS_ADMIN")) {
        req.allowedBranchIds = undefined; // No restrictions
        return next();
    }
    try {
        // Fetch user branch assignments
        const userBranches = await prisma.userbranch.findMany({
            where: { userId },
            select: { branchId: true }
        });
        if (userBranches.length === 0) {
            // No explicit branch restrictions, can access all
            req.allowedBranchIds = undefined;
            return next();
        }
        const allowedBranchIds = userBranches.map(ub => ub.branchId);
        req.allowedBranchIds = allowedBranchIds;
        // Validate request branchId if provided in body or query
        const reqBranchId = (req.body?.branchId || req.query?.branchId);
        if (reqBranchId && !allowedBranchIds.includes(reqBranchId)) {
            return res.status(403).json({ error: "Access denied to this branch." });
        }
        next();
    }
    catch (error) {
        console.error("Branch restriction check error:", error);
        res.status(500).json({ error: "Internal server error during branch authorization" });
    }
};
//# sourceMappingURL=branch.middleware.js.map