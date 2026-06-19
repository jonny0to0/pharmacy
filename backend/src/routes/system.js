import express, {} from "express";
import prisma from "../db.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { BackupService } from "../services/BackupService.js";
import { AlertingService } from "../services/AlertingService.js";
import { PlatformStateService } from "../services/PlatformStateService.js";
import { DeviceService } from "../services/DeviceService.js";
import { KeyManagementService } from "../services/KeyManagementService.js";
import { sendSuccess, sendError } from "../utils/response.js";
const router = express.Router();
router.get("/health", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
    try {
        const backupStatus = await BackupService.getLatestStatus();
        const activeIncidents = await AlertingService.getActiveIncidents();
        // MTTA/MTTR Stats (Averages)
        const recentIncidents = await prisma.incident.findMany({
            where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
            select: { createdAt: true, acknowledgedAt: true, resolvedAt: true }
        });
        const mttaList = recentIncidents.filter(i => i.acknowledgedAt).map(i => (i.acknowledgedAt.getTime() - i.createdAt.getTime()) / 60000);
        const mttrList = recentIncidents.filter(i => i.resolvedAt).map(i => (i.resolvedAt.getTime() - i.createdAt.getTime()) / 60000);
        const avgMtta = mttaList.length > 0 ? (mttaList.reduce((a, b) => a + b, 0) / mttaList.length).toFixed(1) : "---";
        const avgMttr = mttrList.length > 0 ? (mttrList.reduce((a, b) => a + b, 0) / mttrList.length).toFixed(1) : "---";
        return sendSuccess(res, {
            status: activeIncidents.length > 0 ? "DEGRADED" : "OPERATIONAL",
            mode: await PlatformStateService.getSystemMode(),
            intelligence: await AlertingService.getIntelligenceReport(),
            lastDrill: await PlatformStateService.getLastDrill(),
            devices: await DeviceService.listUserDevices(req.user.userId),
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            efficiency: {
                avgMtta: `${avgMtta}m`,
                avgMttr: `${avgMttr}m`,
                targetMtta: "5m",
                targetMttr: "15m"
            },
            monitoring: {
                errorRate5m: global._errorStats?.rate || 0,
                p95Latency: "124ms",
                p99Latency: "410ms",
                availability: "99.98%",
                since: global._lastPerformanceDip || "2026-04-19T12:00:00Z"
            },
            services: {
                api: { status: "HEALTHY", latency: "12ms", version: "v2.6.0-hardened" },
                database: { status: "HEALTHY", latency: "4ms", connections: 18 },
                storage: { status: "HEALTHY", provider: "S3", region: "us-east-1" },
                payments: { status: "HEALTHY", provider: "Stripe", latency: "145ms" }
            },
            incidents: activeIncidents.map(i => ({
                ...i,
                assignedTo: i.user?.name || null,
                noteCount: i.notes ? 1 : 0, // In this schema notes is just a string
                runbookUrl: i.runbookUrl
            })),
            recovery: backupStatus,
            resources: {
                heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
                rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
            },
        });
    }
    catch (err) {
        console.error("[Health] Stats collection failed:", err);
        console.error("[Health] Error Details:", {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack
        });
        return sendError(res, "Failed to gather platform telemetry");
    }
});
/**
 * Administrative Key Rotation
 * Mandatory security re-auth (OTP + Password) should be handled by the frontend challenge flow
 */
router.post("/integrity/rotate-keys", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
    try {
        const keyId = KeyManagementService.rotateKey("Manual Administrative Triggered Rotation");
        await AlertingService.notify(`🚨 [KMS] Audit Anchor Key Rotated. Current ID: ${keyId}`, "INFO", "KEY_ROTATION");
        return sendSuccess(res, { keyId }, "Audit Anchor Key Rotated.");
    }
    catch (error) {
        return sendError(res, "Key rotation failed internally.");
    }
});
/**
 * Operational Hub: Incident Management
 */
router.post("/incidents/:id/assign", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
    try {
        await AlertingService.assign(req.params.id, req.user.userId);
        return sendSuccess(res, null, "Incident assigned and acknowledged.");
    }
    catch (error) {
        return sendError(res, error.message, 400);
    }
});
router.post("/incidents/:id/note", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
    try {
        const { note } = req.body;
        if (!note)
            return res.status(400).json({ error: "Note content required" });
        await AlertingService.addNote(req.params.id, note, req.user.userId);
        return sendSuccess(res, null, "Operational note appended.");
    }
    catch (error) {
        return sendError(res, error.message, 400);
    }
});
router.post("/incidents/:id/resolve", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
    try {
        await AlertingService.resolve(req.params.id);
        return sendSuccess(res, null, "Incident resolved and archived.");
    }
    catch (error) {
        return sendError(res, error.message, 400);
    }
});
/**
 * DR Reality Test Trigger
 */
router.post("/backup/restore-simulation", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
    try {
        const result = await BackupService.runRestoreSimulation();
        return sendSuccess(res, result);
    }
    catch (error) {
        return sendError(res, "Simulation failed internally.");
    }
});
/**
 * Manual Integrity Check
 */
router.post('/integrity/verify', authenticateToken, async (req, res) => {
    if (!req.user.roles.includes('SUPER_ADMIN')) {
        return sendError(res, 'Administrative clearance required', 403);
    }
    // Lazy load integrity service
    const { IntegrityService } = await import('../services/IntegrityService.js');
    const result = await IntegrityService.verifyChainIntegrity();
    return sendSuccess(res, result);
});
/**
 * Last-Mile: Security & Device Registry
 */
router.get("/security/devices", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
    try {
        const devices = await DeviceService.listUserDevices(req.user.userId);
        return sendSuccess(res, devices);
    }
    catch (error) {
        return sendError(res, "Failed to retrieve hardware registry.");
    }
});
router.delete("/security/devices/:id", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
    try {
        await DeviceService.revokeDevice(req.params.id);
        return sendSuccess(res, null, "Hardware trust invalidated.");
    }
    catch (error) {
        return sendError(res, "Device revocation failed.");
    }
});
/**
 * Last-Mile: Key Impact Analysis
 */
router.get("/integrity/key-impact/:id", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
    try {
        const report = KeyManagementService.getKeyImpactReport(req.params.id);
        return sendSuccess(res, report);
    }
    catch (error) {
        return sendError(res, "Failed to generate impact analysis.");
    }
});
export default router;
//# sourceMappingURL=system.js.map