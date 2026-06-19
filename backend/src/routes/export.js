import express, {} from "express";
import prisma from "../db.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { Parser } from "json2csv";
const router = express.Router();
/**
 * @route   GET /api/v1/export/sales
 * @desc    Export sales data for the tenant
 * @access  Private (Admin only)
 */
router.get("/sales", authenticateToken, authorizeRoles("BUSINESS_ADMIN", "MANAGER"), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const sales = await prisma.saleInvoice.findMany({
            where: { tenantId },
            include: {
                customer: { select: { name: true } }
            },
            orderBy: { date: 'desc' }
        });
        const data = sales.map(s => ({
            'Invoice Date': s.date.toLocaleDateString(),
            'Invoice Number': s.invoiceNumber,
            'Customer': s.customer?.name || 'Walk-in',
            'Subtotal': s.subTotal,
            'Tax': s.totalTax,
            'Grand Total': s.grandTotal,
            'Status': s.status
        }));
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(data);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="sales_${new Date().toISOString().split('T')[0]}.csv"`);
        res.status(200).send(csv);
    }
    catch (error) {
        console.error("Export Sales Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * @route   GET /api/v1/export/inventory
 * @desc    Export inventory data for the tenant
 * @access  Private (Admin only)
 */
router.get("/inventory", authenticateToken, authorizeRoles("BUSINESS_ADMIN", "MANAGER"), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const products = await prisma.product.findMany({
            where: {
                tenantId,
                isDeleted: false
            },
            orderBy: { name: 'asc' }
        });
        const data = products.map(p => ({
            'SKU': p.sku,
            'Product Name': p.name,
            'Category': p.category || 'N/A',
            'HSN Code': p.hsnCode || 'N/A',
            'Current Stock': p.currentStock,
            'Unit': p.unit,
            'MRP': p.mrp,
            'Selling Price': p.sellingPrice,
            'Purchase Price': p.purchasePrice,
            'Min Stock Level': p.minStockLevel
        }));
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(data);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="inventory_${new Date().toISOString().split('T')[0]}.csv"`);
        res.status(200).send(csv);
    }
    catch (error) {
        console.error("Export Inventory Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
//# sourceMappingURL=export.js.map