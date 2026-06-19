import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { auditLog } from "../middleware/audit.middleware.js";
import { randomUUID } from "crypto";

const router = express.Router();

// Get all inventory data (products + stock batches)
router.get("/", authenticateToken, requirePermission("INVENTORY.READ"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { search, categoryId } = req.query;

    const whereClause: any = {
      tenantId,
      isDeleted: false
    };

    if (categoryId && typeof categoryId === 'string') {
      whereClause.categoryId = categoryId;
    }

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } }
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        stockbatch: {
          orderBy: {
            expiryDate: 'asc'
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(products);
  } catch (error) {
    console.error("Fetch inventory error:", error);
    res.status(500).json({ error: "Failed to fetch inventory data" });
  }
});

// Adjust stock level for a product/batch
router.post("/adjust", authenticateToken, requirePermission("INVENTORY.CREATE"), auditLog("ADJUST_STOCK", "INVENTORY"), async (req: Request, res: Response): Promise<any> => {
  try {
    const { productId, batchId, quantity, reason } = req.body;
    const tenantId = req.user!.tenantId;

    if (!productId || quantity === undefined || !reason) {
      return res.status(400).json({ error: "productId, quantity, and reason are required." });
    }

    const adjQty = Number(quantity);
    if (isNaN(adjQty)) {
      return res.status(400).json({ error: "Quantity must be a valid number." });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if product exists and belongs to tenant
      const product = await tx.product.findFirst({
        where: { id: productId, tenantId }
      });
      if (!product) {
        throw new Error("Product not found or access denied.");
      }

      // 2. If batchId is provided, check if batch exists and belongs to tenant
      if (batchId) {
        const batch = await tx.stockbatch.findFirst({
          where: { id: batchId, productId, tenantId }
        });
        if (!batch) {
          throw new Error("Batch not found or access denied.");
        }

        // Adjust batch quantity
        await tx.stockbatch.update({
          where: { id: batchId },
          data: {
            quantity: {
              increment: adjQty
            }
          }
        });
      }

      // 3. Adjust product currentStock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: {
            increment: adjQty
          }
        }
      });

      // 4. Record stock adjustment log
      const adjustment = await tx.stockadjustment.create({
        data: {
          id: randomUUID(),
          productId,
          batchId: batchId || null,
          quantity: adjQty,
          reason,
          tenantId,
          updatedAt: new Date()
        }
      });

      return { updatedProduct, adjustment };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Stock adjustment error:", error);
    return res.status(400).json({ error: error.message || "Failed to adjust stock." });
  }
});

export default router;
