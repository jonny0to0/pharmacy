import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { verifyAuditChain } from "../services/auditService.js";
import { sendSuccess } from "../utils/response.js";

const router = express.Router();

/**
 * @route   GET /api/v1/audit-logs
 * @desc    Get audit logs for the tenant
 * @access  Private (Admin/Manager see all, Others see own)
 */
router.get("/", authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const userPayload = req.user!;
    const userId = userPayload.userId;
    const tenantId = userPayload.tenantId;
    const roles = userPayload.roles;

    const isSuperAdmin = roles.includes("SUPER_ADMIN");
    const isAdmin = roles.includes("BUSINESS_ADMIN") || roles.includes("MANAGER") || isSuperAdmin;

    // Pagination
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
    const skip = (page - 1) * limit;

    // Filters
    const module = req.query.module as string;
    const action = req.query.action as string;
    const severity = req.query.severity as string;
    const targetTenantId = req.query.tenantId as string;
    const searchTerm = req.query.searchTerm as string;

    const whereClause: any = {
      ...(isSuperAdmin ? {} : { user: { tenantId: tenantId } }),
      ...(targetTenantId && isSuperAdmin && { user: { tenantId: targetTenantId } }),
      ...(isAdmin ? {} : { userId: userId }),
      ...(module && { module }),
      ...(action && { action }),
      ...(severity && { severity }),
      ...(searchTerm && {
        OR: [
          { action: { contains: searchTerm } },
          { module: { contains: searchTerm } },
          { user: { name: { contains: searchTerm } } },
          { user: { email: { contains: searchTerm } } },
        ]
      })
    };

    const [logs, total] = await prisma.$transaction([
      prisma.auditlog.findMany({
        where: whereClause,
        include: { 
          user: { 
            select: { 
              name: true, 
              email: true,
              tenantId: true
            } 
          } 
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditlog.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get Audit Logs Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route   GET /api/v1/audit-logs/export
 * @desc    Export audit logs to CSV/JSON
 * @access  Private (Super Admin)
 */
router.get("/export", authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.user?.roles.includes("SUPER_ADMIN")) {
      return res.status(403).json({ error: "Export restricted to Super Admins." });
    }

    const { format = 'json', tenantId } = req.query;

    const where = tenantId ? { user: { tenantId: tenantId as string } } : {};
    const logs = await prisma.auditlog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      // Mock CSV generation (requires json2csv)
      return res.header('Content-Type', 'text/csv').attachment('audit_export.csv').send('id,module,action,severity,time\n' + logs.map(l => `${l.id},${l.module},${l.action},${l.severity},${l.createdAt}`).join('\n'));
    }

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Export failed" });
  }
});

/**
 * @route   GET /api/v1/audit-logs/verify
 * @desc    Verify the integrity of the audit log chain
 * @access  Private (Super Admin)
 */
router.get("/verify", authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.user?.roles.includes("SUPER_ADMIN")) {
      return res.status(403).json({ success: false, error: "Verification restricted to Super Admins." });
    }

    const report = await verifyAuditChain();
    return sendSuccess(res, report, "Audit chain verification complete");
  } catch (error) {
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

export default router;
