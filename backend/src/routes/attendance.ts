import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { auditLog } from "../middleware/audit.middleware.js";

const router = express.Router();

// Get Attendance Logs for Tenant (Admin/Manager) or Own Logs (Staff)
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { staffId, startDate, endDate } = req.query;

    // RBAC: If not admin/manager, can only see own logs
    const isAdmin = req.user!.roles.includes("BUSINESS_ADMIN") || req.user!.roles.includes("SUPER_ADMIN");
    const isManager = req.user!.roles.includes("MANAGER");

    let whereClause: any = { tenantId };

    if (!isAdmin && !isManager) {
      whereClause.userId = userId;
    } else if (staffId) {
      whereClause.userId = staffId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate as string);
      if (endDate) whereClause.date.lte = new Date(endDate as string);
    }

    const logs = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, employeeId: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attendance logs" });
  }
});

// Check-In
router.post("/check-in", authenticateToken, auditLog("ATTENDANCE_CHECK_IN", "ATTENDANCE"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { location } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const deviceInfo = req.headers['user-agent'];

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        date: { gte: today },
        checkOut: null
      }
    });

    if (existing) {
      return res.status(400).json({ error: "Already checked in" });
    }

    const log = await prisma.attendance.create({
      data: {
        userId,
        tenantId: tenantId!,
        checkIn: new Date(),
        ipAddress: String(ipAddress),
        deviceInfo,
        location,
        status: 'PRESENT'
      }
    });

    res.json({ message: "Checked in successfully", log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to check in" });
  }
});

// Check-Out
router.post("/check-out", authenticateToken, auditLog("ATTENDANCE_CHECK_OUT", "ATTENDANCE"), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const lastLog = await prisma.attendance.findFirst({
      where: {
        userId,
        checkOut: null
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastLog) {
      return res.status(400).json({ error: "No active check-in found" });
    }

    const log = await prisma.attendance.update({
      where: { id: lastLog.id },
      data: {
        checkOut: new Date()
      }
    });

    res.json({ message: "Checked out successfully", log });
  } catch (error) {
    res.status(500).json({ error: "Failed to check out" });
  }
});

export default router;
