import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.js";
import { expenseSchema } from "../validators/schemas.js";

const router = express.Router();

// Get all expenses
router.get("/", authenticateToken, requirePermission("EXPENSES.READ"), async (req: Request, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

router.post("/", authenticateToken, requirePermission("EXPENSES.CREATE"), validate(expenseSchema), async (req: Request, res: Response) => {
  try {
    const { category, amount, date, description, paymentMode } = req.body;
    const newExpense = await prisma.expense.create({
      data: {
        category,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        description,
        paymentMode: paymentMode || "CASH",
        tenantId: req.user!.tenantId
      }
    });
    res.status(201).json(newExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create expense" });
  }
});

export default router;
