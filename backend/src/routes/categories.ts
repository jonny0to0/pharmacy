import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { auditLog } from "../middleware/audit.middleware.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = express.Router();

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  iconName: z.string().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

// Get all categories for current tenant
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { activeOnly } = req.query;

    const categories = await prisma.category.findMany({
      where: {
        tenantId,
        ...(activeOnly === "true" ? { isActive: true } : {}),
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Create category
router.post(
  "/",
  authenticateToken,
  requirePermission("SETTINGS.UPDATE"),
  auditLog("CREATE_CATEGORY", "SETTINGS"),
  validate(categorySchema),
  async (req: Request, res: Response) => {
    try {
      const { name, iconName, isActive, displayOrder } = req.body;
      const tenantId = req.user!.tenantId;

      const category = await prisma.category.create({
        data: {
          name,
          iconName,
          isActive: isActive ?? true,
          displayOrder: displayOrder ?? 0,
          tenantId,
        },
      });

      res.status(201).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create category" });
    }
  }
);

// Update category
router.put(
  "/:id",
  authenticateToken,
  requirePermission("SETTINGS.UPDATE"),
  auditLog("UPDATE_CATEGORY", "SETTINGS"),
  validate(categorySchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, iconName, isActive, displayOrder } = req.body;
      const tenantId = req.user!.tenantId;

      const category = await prisma.category.update({
        where: {
          id,
          tenantId,
        },
        data: {
          name,
          iconName,
          isActive,
          displayOrder,
        },
      });

      res.json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update category" });
    }
  }
);

// Delete category
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("SETTINGS.DELETE"),
  auditLog("DELETE_CATEGORY", "SETTINGS"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      // Check for products using this category
      const productCount = await prisma.product.count({
        where: { categoryId: id, tenantId },
      });

      if (productCount > 0) {
        return res.status(400).json({
          error: "Cannot delete category as it is currently linked to products",
        });
      }

      await prisma.category.delete({
        where: { id, tenantId },
      });

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  }
);

export default router;
