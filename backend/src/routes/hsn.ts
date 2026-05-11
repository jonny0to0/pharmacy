import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get GST rates for a given HSN code
router.get("/:code", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const hsnRecords = await prisma.hsnmaster.findMany({
      where: {
        hsnCode: code
      },
      select: {
        hsnCode: true,
        gstRate: true,
        description: true
      }
    });

    res.json(hsnRecords);
  } catch (error) {
    console.error("Failed to fetch HSN details:", error);
    res.status(500).json({ error: "Failed to fetch HSN mapping" });
  }
});

// Optional: Get all HSN codes (e.g., for autocomplete dropdown in the future)
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const hsnRecords = await prisma.hsnmaster.findMany({
      select: {
        hsnCode: true,
        gstRate: true,
        description: true
      },
      orderBy: {
        hsnCode: 'asc'
      }
    });
    res.json(hsnRecords);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch HSN list" });
  }
});

export default router;
