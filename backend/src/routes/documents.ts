import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";
import { auditLog } from "../middleware/audit.middleware.js";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const STORAGE_DIR = path.join(process.cwd(), "storage", "documents");

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Upload Document
router.post("/upload", authenticateToken, uploadMiddleware.single("file"), auditLog("DOCUMENT_UPLOAD", "STAFF_DOCS"), async (req: Request, res: Response) => {
  try {
    const { userId, type, name } = req.body;
    const tenantId = req.user!.tenantId;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!userId || !type || !name) return res.status(400).json({ error: "UserId, type and name are required" });

    const fileExt = path.extname(req.file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(STORAGE_DIR, fileName);

    fs.writeFileSync(filePath, req.file.buffer);

    const doc = await prisma.staffdocument.create({
      data: {
        id: uuidv4(),
        userId,
        tenantId: tenantId!,
        type,
        name,
        url: fileName // Only store fileName, path is internal
      }
    });

    res.json({ message: "Document uploaded successfully", doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// Get Documents for a Staff Member
router.get("/staff/:staffId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;

    const isAdmin = req.user!.roles.includes("BUSINESS_ADMIN") || req.user!.roles.includes("SUPER_ADMIN");
    const isManager = req.user!.roles.includes("MANAGER");

    // Staff can only see their own docs, Admin/Manager can see anyone's in tenant
    if (!isAdmin && !isManager && userId !== staffId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const docs = await prisma.staffdocument.findMany({
      where: { userId: staffId, tenantId }
    });

    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// Download/View Document
router.get("/:id", authenticateToken, auditLog("DOCUMENT_VIEW", "STAFF_DOCS"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;

    const doc = await prisma.staffdocument.findFirst({
      where: { id, tenantId }
    });

    if (!doc) return res.status(404).json({ error: "Document not found" });

    const isAdmin = req.user!.roles.includes("BUSINESS_ADMIN") || req.user!.roles.includes("SUPER_ADMIN");
    const isManager = req.user!.roles.includes("MANAGER");

    if (!isAdmin && !isManager && userId !== doc.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const filePath = path.join(STORAGE_DIR, doc.url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

export default router;
