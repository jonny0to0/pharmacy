import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { productSchema, productWithBatchSchema } from "../validators/schemas.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { auditLog } from "../middleware/audit.middleware.js";
import storageService from "../services/storageService.js";
import { randomUUID } from "crypto";

const router = express.Router();
 

// Get all products
router.get("/", authenticateToken, requirePermission(["PRODUCTS.READ", "SALES.READ", "SALES.CREATE"]), async (req: Request, res: Response) => {
  try {
    const { showDeleted, search, categoryId } = req.query;
    const tenantId = req.user!.tenantId;
    const whereClause: any = { tenantId };
    
    if (showDeleted !== 'true') {
      whereClause.isDeleted = false;
    }

    if (categoryId && typeof categoryId === 'string') {
      whereClause.categoryId = categoryId;
    }

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search as string } },
        { sku: { contains: search as string } },
        { barcode: { contains: search as string } }
      ];
    }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        stockbatch: {
          where: {
            quantity: { gt: 0 }
          },
          orderBy: {
            expiryDate: 'asc'
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedProducts = products.map(p => ({
      ...p,
      image: storageService.getImageUrlObject(p.imageKey)
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Create product (simple)
router.post("/", authenticateToken, requirePermission("PRODUCTS.CREATE"), auditLog("CREATE_PRODUCT", "PRODUCTS"), validate(productSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      name, sku, barcode, category, hsnCode, unit, manufacturer,
      purchasePrice, sellingPrice, mrp, currentStock,
      gstRate, minStockLevel, location, imageKey,
      medicalDescription, uses, contraindications, sideEffects, precautions, dosageInfo 
    } = req.body;

    // Validation logging
    if (!name || purchasePrice === undefined || sellingPrice === undefined) {
      console.warn("Validation Error: Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hasMedicalInfo = !!(medicalDescription || uses || contraindications || sideEffects || precautions || dosageInfo);

    const generatedSku = sku && sku.trim() !== "" ? sku : `SKU-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const newProduct = await prisma.product.create({
      data: {
        id: randomUUID(),
        name, sku: generatedSku, barcode, categoryName: category, hsnCode, unit, manufacturer,
        purchasePrice, sellingPrice, mrp, currentStock,
        gstRate, minStockLevel, location, imageKey,
        medicalDescription, uses, contraindications, sideEffects, precautions, dosageInfo,
        hasMedicalInfo,
        updatedAt: new Date(),
        tenantId: req.user!.tenantId
      }
    });

    return res.status(201).json({
      ...newProduct,
      image: storageService.getImageUrlObject(newProduct.imageKey)
    });
  } catch (error: any) {
    console.error("Create Product Error:", error);
    return res.status(500).json({ 
      message: "Failed to create product",
      error: error.message || "Unknown error"
    });
  }
});

// Create product with batches (Pharmacy Grade)
router.post("/create-with-batch", authenticateToken, requirePermission("PRODUCTS.CREATE"), auditLog("CREATE_PRODUCT_WITH_BATCH", "PRODUCTS"), validate(productWithBatchSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    console.log("Create with batch Payload:", JSON.stringify(req.body, null, 2));
    const { product, batches } = req.body;
    const tenantId = req.user!.tenantId;

    if (!product || !product.name) {
      console.warn("Validation Error: Missing required product fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    const generatedSku = product.sku && product.sku.trim() !== "" ? product.sku : `SKU-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const result = await prisma.$transaction(async (tx) => {
      const { category, ...restProduct } = product;

      // 1. Create Product
      const newProduct = await tx.product.create({
        data: {
          id: randomUUID(),
          ...restProduct,
          sku: generatedSku,
          categoryName: category,
          hasMedicalInfo: !!(
            product.medicalDescription || 
            product.uses || 
            product.contraindications || 
            product.sideEffects || 
            product.precautions || 
            product.dosageInfo
          ),
          updatedAt: new Date(),
          tenantId
        }
      });

      // 2. Create Batches if any
      if (batches && batches.length > 0) {
        await tx.stockbatch.createMany({
          data: batches.map((b: any) => ({
            id: randomUUID(),
            productId: newProduct.id,
            batchNumber: b.batchNo,
            mfgDate: new Date(b.mfgDate),
            expiryDate: new Date(b.expiryDate),
            quantity: b.quantity,
            purchasePrice: b.purchasePrice,
            sellingPrice: b.sellingPrice,
            mrp: b.mrp,
            supplierId: b.supplierId || null,
            tenantId,
            isVerified: true,
            updatedAt: new Date()
          }))
        });

        // 3. Update Product currentStock
        const totalQty = batches.reduce((sum: number, b: any) => sum + b.quantity, 0);
        await tx.product.update({
          where: { id: newProduct.id },
          data: { currentStock: totalQty }
        });
      }

      return await tx.product.findUnique({
        where: { id: newProduct.id },
        include: { stockbatch: true }
      });
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Create Product with Batch Error:", error);
    return res.status(500).json({ 
      message: "Failed to create product and batches",
      error: error.message || "Unknown error"
    });
  }
});

// Update product
router.put("/:id", authenticateToken, requirePermission("PRODUCTS.UPDATE"), auditLog("UPDATE_PRODUCT", "PRODUCTS"), validate(productSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    const { 
      name, sku, purchasePrice, category, hsnCode, unit,
      sellingPrice, mrp, gstRate, minStockLevel, currentStock, location, imageKey,
      medicalDescription, uses, contraindications, sideEffects, precautions, dosageInfo
    } = req.body;

    const hasMedicalInfo = !!(
      medicalDescription || 
      uses || 
      contraindications || 
      sideEffects || 
      precautions || 
      dosageInfo ||
      false
    );

    const { userId } = req.user!;
    // Fetch user permissions for field-level check (could be optimized with a specialized hook but let's be strict here)
    const userPermissions = await prisma.user.findUnique({
      where: { id: userId },
      include: { userrole: { include: { role: { include: { rolepermission: { include: { permission: true }}}}}}}
    }).then(u => u?.userrole.flatMap(ur => ur.role.rolepermission.map(rp => rp.permission.name)) || []);

    const hasUpdateMaster = userPermissions.includes("PRODUCTS.UPDATE_MASTER") || userPermissions.includes("ALL_ACCESS");

    const updateData: any = {
      name, sku, hsnCode, unit, sellingPrice, mrp, minStockLevel, currentStock, location, imageKey,
      medicalDescription, uses, contraindications, sideEffects, precautions, dosageInfo,
      hasMedicalInfo,
      updatedAt: new Date()
    };

    // Restricted Fields Guardrail
    if (hasUpdateMaster) {
      if (purchasePrice !== undefined) updateData.purchasePrice = purchasePrice;
      if (gstRate !== undefined) updateData.gstRate = gstRate;
      if (category !== undefined) updateData.categoryName = category;
    } else {
      // Log field-level restriction attempt if they tried to change these
      if (purchasePrice !== undefined || gstRate !== undefined || category !== undefined) {
        console.warn(`[SECURITY] User ${userId} attempted to update restricted fields for product ${id}`);
        // Optionally ignore instead of blocking the whole update to avoid breaking UI forms
      }
    }

    const existingProduct = await prisma.product.findFirst({
        where: { id, tenantId }
    });
    if (!existingProduct) {
        return res.status(404).json({ error: "Product not found or access denied" });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });

    res.json({
      ...updatedProduct,
      image: storageService.getImageUrlObject(updatedProduct.imageKey)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product
router.delete("/:id", authenticateToken, requirePermission("PRODUCTS.DELETE"), auditLog("DELETE_PRODUCT", "PRODUCTS"), async (req: Request, res: Response): Promise<void> => {
   try {
     const { id } = req.params;
     const tenantId = req.user!.tenantId;

    // Check if the product has related records
    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        saleinvoiceitem: { take: 1 },
        purchasebillitem: { take: 1 },
        purchaseorderitem: { take: 1 },
        salesorderitem: { take: 1 },
        stockadjustment: { take: 1 }
      }
    });

    if (!product) {
      res.status(404).json({ error: "Product not found or access denied" });
      return;
    }

    const hasRelations = 
      (product as any).saleinvoiceitem.length > 0 || 
      (product as any).purchasebillitem.length > 0 || 
      (product as any).purchaseorderitem.length > 0 || 
      (product as any).salesorderitem.length > 0 || 
      (product as any).stockadjustment.length > 0;

    if (hasRelations) {
      // Soft delete
      await prisma.product.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });
      res.json({ message: "Product softly deleted as it is linked to existing records", type: "soft" });
    } else {
      // Hard delete
      await prisma.product.delete({
        where: { id }
      });
      res.json({ message: "Product permanently deleted", type: "hard" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Get generic insights (Low stock)
router.get("/low-stock", authenticateToken, requirePermission("PRODUCTS.READ"), async (req: Request, res: Response) => {
  try {
    const minStockLevel = 10;
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isDeleted: false,
        tenantId: req.user!.tenantId,
        currentStock: {
          lt: 10 // Need to update this generic check, Prisma doesn't easily let us compare column to column without raw query, so keep arbitrary 10 or do raw query
        }
      }
    });
    res.json(lowStockProducts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch low stock metrics" });
  }
});

export default router;
