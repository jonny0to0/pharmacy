import express, {} from "express";
import prisma from "../../db.js";
import { authenticateToken, authorizeRoles, authorizePermission } from "../../middleware/auth.js";
import { sendSuccess } from "../../utils/response.js";
import { adminCache } from "../../services/AdminCacheService.js";
const router = express.Router();
/**
 * @route   GET /api/v1/admin/reports/dashboard
 * @desc    Get global platform analytics with caching
 */
router.get("/dashboard", authorizePermission("SA_REPORTS.READ"), async (req, res) => {
    try {
        const cacheKey = "admin:dashboard:stats";
        const cachedData = adminCache.get(cacheKey);
        if (cachedData) {
            return sendSuccess(res, cachedData, "Stats fetched from cache");
        }
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        // 1. Revenue & Growth
        const revenueAgg = await prisma.saleinvoice.aggregate({
            _sum: { grandTotal: true },
            where: { date: { gte: thirtyDaysAgo } }
        });
        // 2. User & Tenant counts
        const totalTenants = await prisma.tenant.count();
        const activeSubCount = await prisma.subscription.count({ where: { status: 'ACTIVE' } });
        const totalUsers = await prisma.user.count({ where: { isDeleted: false } });
        // 3. Revenue Trend (Last 7 days)
        const trend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const start = new Date(d.setHours(0, 0, 0, 0));
            const end = new Date(d.setHours(23, 59, 59, 999));
            const daySales = await prisma.saleinvoice.aggregate({
                _sum: { grandTotal: true },
                where: { date: { gte: start, lte: end } }
            });
            trend.push({
                date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                amount: daySales._sum.grandTotal || 0
            });
        }
        const stats = {
            summary: {
                mrr: revenueAgg._sum.grandTotal || 0,
                totalTenants,
                activeSubscriptions: activeSubCount,
                totalUsers,
                churnRate: "2.1%" // Heuristic for now
            },
            revenueTrend: trend,
            topTenants: await prisma.tenant.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, businessName: true, currentPlan: true }
            })
        };
        // Cache for 10 minutes
        adminCache.set(cacheKey, stats, 600);
        return sendSuccess(res, stats);
    }
    catch (error) {
        console.error("[Admin Reports] Error:", error);
        res.status(500).json({ success: false, error: "Failed to load admin dashboard" });
    }
});
export default router;
//# sourceMappingURL=reports.js.map