import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.js";
import { paymentSchema } from "../validators/schemas.js";

const router = express.Router();

// Get all payments
router.get("/", authenticateToken, requirePermission("PAYMENTS.READ"), async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { date: 'desc' },
      include: {
        customer: { select: { name: true } },
        supplier: { select: { name: true } },
        saleInvoice: { select: { invoiceNumber: true } },
        purchaseBill: { select: { billNumber: true } }
      }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Receive payment from customer
router.post("/receive", authenticateToken, requirePermission("PAYMENTS.CREATE"), validate(paymentSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, amount, mode, referenceNo, saleInvoiceId, date } = req.body;
    const paymentAmount = Number(amount);
    const tenantId = req.user!.tenantId;

    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const newPayment = await tx.payment.create({
        data: {
          type: "RECEIPT",
          amount: paymentAmount,
          mode: mode || "CASH",
          referenceNo,
          date: date ? new Date(date) : new Date(),
          customerId,
          saleInvoiceId,
          tenantId
        }
      });

      // 2. Update Customer Outstanding Balance
      if (customerId) {
        const cust = await tx.customer.findUnique({ where: { id: customerId }});
        if (!cust || cust.tenantId !== tenantId) throw new Error("Invalid customer");

        await tx.customer.update({
          where: { id: customerId },
          data: { outstandingBalance: { decrement: paymentAmount } }
        });
      }

      // 3. Update Invoice if linked
      if (saleInvoiceId) {
        const invoice = await tx.saleInvoice.findUnique({ where: { id: saleInvoiceId } });
        if (!invoice || invoice.tenantId !== tenantId) throw new Error("Invalid invoice");
        if (invoice) {
          const newAmountPaid = invoice.amountPaid + paymentAmount;
          let newStatus = "PARTIAL";
          if (newAmountPaid >= invoice.grandTotal) {
             newStatus = "PAID";
          }
          await tx.saleInvoice.update({
            where: { id: saleInvoiceId },
            data: { 
              amountPaid: newAmountPaid,
              status: newStatus as "PARTIAL" | "PAID"
            }
          });
        }
      }

      return newPayment;
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process receipt" });
  }
});

// Make payment to supplier
router.post("/pay", authenticateToken, requirePermission("PAYMENTS.CREATE"), validate(paymentSchema), async (req: Request, res: Response) => {
  try {
    const { supplierId, amount, mode, referenceNo, purchaseBillId, date } = req.body;
    const paymentAmount = Number(amount);
    const tenantId = req.user!.tenantId;

    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const newPayment = await tx.payment.create({
        data: {
          type: "PAYMENT",
          amount: paymentAmount,
          mode: mode || "CASH",
          referenceNo,
          date: date ? new Date(date) : new Date(),
          supplierId,
          purchaseBillId,
          tenantId
        }
      });

      // 2. Update Supplier Outstanding Balance
      if (supplierId) {
        const sup = await tx.supplier.findUnique({ where: { id: supplierId }});
        if (!sup || sup.tenantId !== tenantId) throw new Error("Invalid supplier");

        await tx.supplier.update({
          where: { id: supplierId },
          data: { outstandingBalance: { decrement: paymentAmount } }
        });
      }

      // 3. Update Purchase Bill if linked
      if (purchaseBillId) {
        const bill = await tx.purchaseBill.findUnique({ where: { id: purchaseBillId } });
        if (!bill || bill.tenantId !== tenantId) throw new Error("Invalid purchase bill");

        if (bill) {
          const newAmountPaid = bill.amountPaid + paymentAmount;
          let newStatus = "PARTIAL";
          if (newAmountPaid >= bill.grandTotal) {
             newStatus = "PAID";
          }
          await tx.purchaseBill.update({
            where: { id: purchaseBillId },
            data: { 
              amountPaid: newAmountPaid,
              status: newStatus as "PARTIAL" | "PAID"
            }
          });
        }
      }

      // 4. Create Supplier Ledger Entry (New)
      if (supplierId) {
        const latestSup = await tx.supplier.findUnique({ where: { id: supplierId } });
        await tx.supplierLedger.create({
          data: {
            supplierId,
            tenantId,
            type: "PAYMENT",
            amount: paymentAmount,
            balance: latestSup!.outstandingBalance,
            description: `Payment recorded ${referenceNo ? `- Ref: ${referenceNo}` : ''}`,
            referenceId: newPayment.id,
            date: date ? new Date(date) : new Date()
          }
        });
      }

      return newPayment;
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

export default router;
