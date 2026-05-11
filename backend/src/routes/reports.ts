import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import PDFDocument from "pdfkit";
import { sendSuccess, sendError } from "../utils/response.js";
import { enforceTenantScope } from "../middleware/tenant.middleware.js";

const router = express.Router();

// Get Dashboard Analytics
router.get("/dashboard", authenticateToken, enforceTenantScope, async (req: Request, res: Response) => {
  try {
    const isSuperAdmin = req.user!.roles.includes("SUPER_ADMIN");
    const tenantId = req.user!.tenantId;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    if (isSuperAdmin) {
      // 1. Total Platform Revenue (All Time)
      const totalSalesAgg = await prisma.saleinvoice.aggregate({
        _sum: { grandTotal: true },
      });
      const totalRevenue = totalSalesAgg._sum.grandTotal || 0;

      // 2. Platform MRR (Last 30 days revenue)
      const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      const mrrAgg = await prisma.saleinvoice.aggregate({
        _sum: { grandTotal: true },
        where: { date: { gte: thirtyDaysAgo } }
      });
      const mrr = mrrAgg._sum.grandTotal || 0;

      // 3. Total Businesses & Subscriptions
      const totalTenants = await prisma.tenant.count();
      const activeSubscriptions = await prisma.subscription.count({
        where: { status: 'ACTIVE' }
      });

      // 4. Failed Payments (Mocked for now based on Audit Logs with CRITICAL severity)
      const failedPaymentsCount = await prisma.auditlog.count({
        where: { action: 'PAYMENT_FAILED', severity: 'CRITICAL' }
      });

      // 5. Recent Registrations
      const recentRegistrations = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          businessName: true,
          businessType: true,
          createdAt: true
        }
      });

      // 6. Top 5 Businesses by Sales
      const topBusinesses = await prisma.saleinvoice.groupBy({
        by: ['tenantId'],
        _sum: { grandTotal: true },
        orderBy: { _sum: { grandTotal: 'desc' } },
        take: 5
      });

      const topBusinessesEnriched = await Promise.all(
        topBusinesses.map(async (b) => {
          const tenant = await prisma.tenant.findUnique({
            where: { id: b.tenantId },
            select: { businessName: true }
          });
          return {
            name: tenant?.businessName || "Unknown",
            totalSales: b._sum.grandTotal || 0
          };
        })
      );

      // 7. Last 30 Days Revenue Trend (Grouped by Date)
      const revenueTrend: any[] = [];
      const trendDays = 30;
      for (let i = trendDays - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end = new Date(d.setHours(23, 59, 59, 999));
        const daySales = await prisma.saleinvoice.aggregate({
          _sum: { grandTotal: true },
          where: { date: { gte: start, lte: end } }
        });
        revenueTrend.push({
          date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: daySales._sum.grandTotal || 0
        });
      }

      return sendSuccess(res, {
        isSuperAdmin: true,
        summary: {
          totalRevenue,
          mrr,
          totalTenants,
          activeSubscriptions,
          failedPayments: failedPaymentsCount,
          churnRate: "2.4%" // Mocked for now
        },
        topBusinesses: topBusinessesEnriched,
        recentRegistrations,
        revenueTrend
      });
    }

    // Default Tenant logic
    // 1. Total Sales
    const totalSalesAgg = await prisma.saleinvoice.aggregate({
      _sum: { grandTotal: true },
      where: { tenantId: tenantId! }
    });
    const totalSales = totalSalesAgg._sum.grandTotal || 0;

    // 2. Total Purchases
    const totalPurchasesAgg = await prisma.purchasebill.aggregate({
      _sum: { grandTotal: true },
      where: { tenantId: tenantId! }
    });
    const totalPurchases = totalPurchasesAgg._sum.grandTotal || 0;

    // 3. Transactions (Sales Count)
    const totalTransactions = await prisma.saleinvoice.count({
      where: { tenantId: tenantId! }
    });

    // 4. Net Profit
    const netProfit = totalSales - totalPurchases;

    // 5. Recent Transactions
    const recentSales = await prisma.saleinvoice.findMany({
      where: { tenantId: tenantId! },
      orderBy: { date: 'desc' },
      take: 5,
      include: { customer: { select: { name: true } } }
    });

    // 6. Low Stock Products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        tenantId: tenantId!,
        currentStock: { lt: 10 }
      },
      take: 5
    });

    // 7. Last 7 Days Sales Trend
    const last7DaysSales: any[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end = new Date(d.setHours(23, 59, 59, 999));
        const daySales = await prisma.saleinvoice.aggregate({
          _sum: { grandTotal: true },
          where: {
            tenantId: tenantId!,
            date: { gte: start, lte: end }
          }
        });
        last7DaysSales.push({
          date: start.toLocaleDateString('en-US', { weekday: 'short' }),
          amount: daySales._sum.grandTotal || 0
        });
    }

    return sendSuccess(res, {
      summary: {
        totalSales,
        totalPurchases,
        totalTransactions,
        netProfit,
        // Keep others for backward compatibility if needed
        amountReceivable: (await prisma.customer.aggregate({ _sum: { outstandingBalance: true }, where: { tenantId: tenantId! } }))._sum.outstandingBalance || 0,
        amountPayable: (await prisma.supplier.aggregate({ _sum: { outstandingBalance: true }, where: { tenantId: tenantId! } }))._sum.outstandingBalance || 0,
      },
      recentSales,
      lowStockProducts,
      salesTrend: last7DaysSales
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return sendError(res, "Failed to load dashboard analytics");
  }
});

// GET /reports/sales-summary
router.get("/sales-summary", authenticateToken, enforceTenantScope, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user!.tenantId;
    
    const where: any = { tenantId: tenantId! };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const sales = await prisma.saleinvoice.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { customer: { select: { name: true } } }
    });

    const summary = await prisma.saleinvoice.aggregate({
      where,
      _sum: {
        grandTotal: true,
        totalTax: true,
        discount: true
      },
      _count: { id: true }
    });

    return sendSuccess(res, { sales, summary });
  } catch (error) {
    return sendError(res, "Failed to fetch sales summary");
  }
});

// GET /reports/daily-closing
router.get("/daily-closing", authenticateToken, enforceTenantScope, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const sales = await prisma.saleinvoice.aggregate({
      where: {
        tenantId: tenantId!,
        date: { gte: startOfDay, lte: endOfDay }
      },
      _sum: { grandTotal: true },
      _count: { id: true }
    });

    // Simple breakdown of payments for today
    const payments = await prisma.payment.groupBy({
      by: ['mode'],
      where: {
        tenantId: tenantId!,
        date: { gte: startOfDay, lte: endOfDay }
      },
      _sum: { amount: true }
    });

    return sendSuccess(res, {
      date: startOfDay,
      totalSales: sales._sum.grandTotal || 0,
      transactionCount: sales._count.id || 0,
      paymentBreakdown: payments.map(p => ({ mode: p.mode, amount: p._sum.amount || 0 }))
    });
  } catch (error) {
    return sendError(res, "Failed to fetch daily closing");
  }
});

// GET /reports/purchase-summary
router.get("/purchase-summary", authenticateToken, enforceTenantScope, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user!.tenantId;
    
    const where: any = { tenantId: tenantId! };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const purchases = await prisma.purchasebill.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { supplier: { select: { name: true } } }
    });

    const summary = await prisma.purchasebill.aggregate({
      where,
      _sum: {
        grandTotal: true,
        totalTax: true
      },
      _count: { id: true }
    });

    return sendSuccess(res, { purchases, summary });
  } catch (error) {
    return sendError(res, "Failed to fetch purchase summary");
  }
});

// GET /reports/inventory-status
router.get("/inventory-status", authenticateToken, enforceTenantScope, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const products = await prisma.product.findMany({
      where: { tenantId: tenantId!, isDeleted: false },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        purchasePrice: true,
        minStockLevel: true,
        category: true
      }
    });

    const lowStock = products.filter(p => p.currentStock <= p.minStockLevel);
    const totalValuation = products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);

    return sendSuccess(res, {
      products,
      lowStock,
      summary: {
        totalItems: products.length,
        totalValuation,
        lowStockCount: lowStock.length
      }
    });
  } catch (error) {
    return sendError(res, "Failed to fetch inventory status");
  }
});

// GET /reports/profit-loss (Simplified: Sales - Purchase)
router.get("/profit-loss", authenticateToken, enforceTenantScope, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user!.tenantId;
    
    const where: any = { tenantId: tenantId! };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const totalSales = await prisma.saleinvoice.aggregate({
      where,
      _sum: { grandTotal: true }
    });

    const totalPurchases = await prisma.purchasebill.aggregate({
      where,
      _sum: { grandTotal: true }
    });

    const sales = totalSales._sum.grandTotal || 0;
    const purchases = totalPurchases._sum.grandTotal || 0;

    return sendSuccess(res, {
      sales,
      purchases,
      grossProfit: sales - purchases,
      period: { startDate, endDate }
    });
  } catch (error) {
    return sendError(res, "Failed to calculate P&L");
  }
});

// GET /reports/gst-summary
router.get("/gst-summary", authenticateToken, enforceTenantScope, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user!.tenantId;
    
    const where: any = { tenantId: tenantId! };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const salesTax = await prisma.saleinvoice.aggregate({
      where,
      _sum: {
        cgst: true,
        sgst: true,
        igst: true,
        totalTax: true
      }
    });

    const purchaseTax = await prisma.purchasebill.aggregate({
      where,
      _sum: {
        totalTax: true
      }
    });

    return sendSuccess(res, {
      outputTax: salesTax._sum,
      inputTax: { total: purchaseTax._sum.totalTax || 0 },
      netTaxPayable: (salesTax._sum.totalTax || 0) - (purchaseTax._sum.totalTax || 0)
    });
  } catch (error) {
    return sendError(res, "Failed to fetch GST summary");
  }
});

// Export Report
router.get("/export", authenticateToken, enforceTenantScope, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=report.pdf");

    doc.text("Sales Report and Business Overview", { align: 'center' });
    doc.moveDown();

    const totalSalesAgg = await prisma.saleinvoice.aggregate({ _sum: { grandTotal: true }, where: { tenantId } });
    const totalSales = totalSalesAgg._sum.grandTotal || 0;

    const totalPurchasesAgg = await prisma.purchasebill.aggregate({ _sum: { grandTotal: true }, where: { tenantId } });
    const totalPurchases = totalPurchasesAgg._sum.grandTotal || 0;
    
    const amountReceivableAgg = await prisma.customer.aggregate({ _sum: { outstandingBalance: true }, where: { tenantId } });
    const amountReceivable = amountReceivableAgg._sum.outstandingBalance || 0;

    doc.text(`Total Sales: Rs. ${totalSales}`);
    doc.text(`Total Purchases: Rs. ${totalPurchases}`);
    doc.text(`Net Profit: Rs. ${totalSales - totalPurchases}`);
    doc.text(`Amount Receivable: Rs. ${amountReceivable}`);

    doc.moveDown();
    const recentSales = await prisma.saleinvoice.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      take: 10,
      include: { customer: { select: { name: true } } }
    });

    doc.text("Recent Sales:", { underline: true });
    doc.moveDown();
    recentSales.forEach(sale => {
      doc.text(`${new Date(sale.date).toLocaleDateString()} - ${sale.invoiceNumber} - Rs. ${sale.grandTotal} (${sale.customer?.name || 'Walk-in'})`);
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export report" });
  }
});

export default router;
