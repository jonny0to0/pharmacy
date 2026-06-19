import express, {} from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { checkBranchRestriction } from "../middleware/branch.middleware.js";
import { randomUUID } from "crypto";
const router = express.Router();
// Get all sales invoices
router.get("/", authenticateToken, requirePermission("SALES.READ"), checkBranchRestriction, async (req, res) => {
    try {
        const invoices = await prisma.saleinvoice.findMany({
            where: {
                tenantId: req.user.tenantId,
                ...(req.allowedBranchIds ? { branchId: { in: req.allowedBranchIds } } : {})
            },
            include: {
                customer: { select: { name: true, phone: true } },
                saleinvoiceitem: true
            },
            orderBy: { date: 'desc' }
        });
        // Map to maintain API compatibility if frontend expects "items"
        const mappedInvoices = invoices.map(inv => ({
            ...inv,
            items: inv.saleinvoiceitem
        }));
        res.json(mappedInvoices);
    }
    catch (error) {
        console.error("Fetch invoices error:", error);
        res.status(500).json({ error: "Failed to fetch invoices" });
    }
});
// Create a new sales invoice
router.post("/", authenticateToken, requirePermission("SALES.CREATE"), checkBranchRestriction, async (req, res) => {
    const { invoiceNumber, customerId, type, items, subTotal, totalTax, discount, cgst, sgst, igst, grandTotal, amountPaid, paymentMode, isCash, branchId } = req.body;
    const tenantId = req.user.tenantId;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: "Invoice must contain at least one item." });
    }
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Validate Stock and Prices First
            for (const item of items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product || product.tenantId !== tenantId)
                    throw new Error(`Product not found or access denied.`);
                // 1. Check Batch Stock if Batch ID is provided
                if (item.batchId) {
                    const batch = await tx.stockbatch.findUnique({ where: { id: item.batchId } });
                    if (!batch || batch.productId !== product.id)
                        throw new Error(`Batch not found for product ${product.name}`);
                    if (batch.quantity < Number(item.quantity)) {
                        throw new Error(`Insufficient stock in batch ${batch.batchNumber} for product ${product.name}`);
                    }
                    // Validate against Batch Price if different from Product Price
                    const expectedPrice = batch.sellingPrice > 0 ? batch.sellingPrice : product.sellingPrice;
                    if (Math.abs(Number(item.rate) - expectedPrice) > 0.01) {
                        // Allow minor rounding or just log it, but for safety let's be batch-aware
                        // throw new Error(`Price mismatch for batch ${batch.batchNumber}. Expected ₹${expectedPrice}, got ₹${item.rate}`);
                    }
                }
                else {
                    // Fallback to simple product stock check
                    if (product.currentStock < Number(item.quantity)) {
                        throw new Error(`Insufficient total stock for product ${product.name}`);
                    }
                }
            }
            if (customerId) {
                const customer = await tx.customer.findUnique({ where: { id: customerId } });
                if (!customer || customer.tenantId !== tenantId)
                    throw new Error("Customer not found or access denied.");
            }
            // Create the invoice
            const invoice = await tx.saleinvoice.create({
                data: {
                    id: randomUUID(),
                    invoiceNumber,
                    customerId,
                    tenantId,
                    branchId: branchId || (req.allowedBranchIds ? req.allowedBranchIds[0] : null),
                    type: type || "TAX_INVOICE",
                    subTotal: Number(subTotal),
                    totalTax: Number(totalTax),
                    discount: Number(discount) || 0,
                    cgst: Number(cgst) || 0,
                    sgst: Number(sgst) || 0,
                    igst: Number(igst) || 0,
                    grandTotal: Number(grandTotal),
                    amountPaid: Number(amountPaid) || 0,
                    isCash: Boolean(isCash),
                    status: amountPaid >= grandTotal ? "PAID" : (amountPaid > 0 ? "PARTIAL" : "UNPAID"),
                    updatedAt: new Date(),
                    saleinvoiceitem: {
                        create: items.map((item) => ({
                            id: randomUUID(),
                            productId: item.productId,
                            tenantId,
                            quantity: Number(item.quantity),
                            rate: Number(item.rate),
                            gstRate: Number(item.gstRate),
                            taxableAmount: Number(item.taxableAmount),
                            cgstAmount: Number(item.cgstAmount) || 0,
                            sgstAmount: Number(item.sgstAmount) || 0,
                            igstAmount: Number(item.igstAmount) || 0,
                            total: Number(item.total),
                            updatedAt: new Date(),
                        }))
                    }
                }
            });
            // Update inventory stock for each item (Product & Batch)
            for (const item of items) {
                // 1. Update Product Total Stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        currentStock: {
                            decrement: Number(item.quantity)
                        }
                    }
                });
                // 2. Update Specific Batch Stock
                if (item.batchId) {
                    await tx.stockbatch.update({
                        where: { id: item.batchId },
                        data: {
                            quantity: {
                                decrement: Number(item.quantity)
                            }
                        }
                    });
                }
            }
            // Update customer balance if credit sale
            if (customerId && amountPaid < grandTotal) {
                await tx.customer.update({
                    where: { id: customerId },
                    data: {
                        outstandingBalance: {
                            increment: grandTotal - Number(amountPaid)
                        }
                    }
                });
            }
            // Record Payment if amountPaid > 0
            if (amountPaid > 0) {
                let modeEnum = "CASH";
                if (["UPI", "CARD", "BANK_TRANSFER", "CHEQUE"].includes(paymentMode)) {
                    modeEnum = paymentMode;
                }
                await tx.payment.create({
                    data: {
                        id: randomUUID(),
                        type: "RECEIPT",
                        amount: Number(amountPaid),
                        mode: modeEnum,
                        date: new Date(),
                        customerId: customerId || null,
                        saleInvoiceId: invoice.id,
                        tenantId,
                        branchId: branchId || (req.allowedBranchIds ? req.allowedBranchIds[0] : null),
                        updatedAt: new Date()
                    }
                });
            }
            return invoice;
        });
        res.status(201).json(result);
    }
    catch (error) {
        console.error("Sale Invoice Error:", error);
        res.status(500).json({ error: error.message || "Failed to create sales invoice. Database transaction rolled back." });
    }
});
export default router;
//# sourceMappingURL=sales.js.map