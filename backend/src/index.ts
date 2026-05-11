import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { rateLimit } from "express-rate-limit";

// Load environment variables before any other processing
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Routes
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import customerRoutes from "./routes/customers.js";
import supplierRoutes from "./routes/suppliers.js";
import salesRoutes from "./routes/sales.js";
import purchaseRoutes from "./routes/purchases.js";
import expenseRoutes from "./routes/expenses.js";
import paymentRoutes from "./routes/payments.js";
import reportRoutes from "./routes/reports.js";
import settingRoutes from "./routes/settings.js";
import hsnRoutes from "./routes/hsn.js";
import setupRoutes from "./routes/setup.js";
import userRoutes from "./routes/users.js";
import roleRoutes from "./routes/roles.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import uploadRoutes from "./routes/upload.js";
import systemRoutes from "./routes/system.js";
import securityRoutes from "./routes/security.js";
import notificationRoutes from "./routes/notifications.js";
import exportRoutes from "./routes/export.js";
import auditLogRoutes from "./routes/auditLog.js";
import attendanceRoutes from "./routes/attendance.js";
import leaveRoutes from "./routes/leaves.js";
import documentRoutes from "./routes/documents.js";

// Super Admin Routes
import adminBusinessRoutes from "./routes/admin/businesses.js";
import adminUserRoutes from "./routes/admin/users.js";
import adminSearchRoutes from "./routes/admin/search.js";
import adminImpersonateRoutes from "./routes/admin/impersonate.js";
import adminSecurityRoutes from "./routes/admin/security.js";
import adminGodModeRoutes from "./routes/admin/godmode.js";
import adminSubscriptionsRoutes from "./routes/admin/subscriptions.js";
import adminFeatureFlagsRoutes from "./routes/admin/feature-flags.js";
import adminIntegrationsRoutes from "./routes/admin/integrations.js";
import adminSupportRoutes from "./routes/admin/support.js";
import adminNotificationsRoutes from "./routes/admin/notifications.js";
import adminSettingsRoutes from "./routes/admin/settings.js";
import adminReportsRoutes from "./routes/admin/reports.js";
import adminPlansRoutes from "./routes/admin/plans.js";

// Middleware & Services
import { adminLogger } from "./middleware/adminLogger.js";
import { authenticateToken } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { correlationMiddleware } from "./middleware/correlation.js";
import { AlertingService } from "./services/AlertingService.js";
import { LifecycleManager } from "./services/LifecycleManager.js";
import { RBACService } from "./services/RBACService.js";
import { IntegrityService } from "./services/IntegrityService.js";
import prisma from "./db.js";

// Enterprise-Grade Rate Limiting
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: "Search discovery limit exceeded. Please wait 1 minute." }
});

const challengeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { error: "Too many security challenges. Administrative account locked for 5 minutes." }
});

const initSystem = async () => {
  try {
    console.log("🚀 [SYSTEM] Initializing core services...");
    await IntegrityService.initialize();
    await AlertingService.initialize();
    await RBACService.initializeSystemPermissions();
    console.log("🚀 [SYSTEM] All core services initialized successfully.");
  } catch (error) {
    console.error("🔥 [FATAL] System initialization failed:", error);
    fs.appendFileSync('init-error.log', `${new Date().toISOString()} - ${error instanceof Error ? error.stack : String(error)}\n`);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
};

import fs from "fs";

initSystem();

setInterval(() => AlertingService.runEscalationCheck(), 60000); // Check every minute
setInterval(() => LifecycleManager.runCycle(), 600000); // Check every 10 minutes

const app = express();

// 1. Initial Identity & Tracing Context
app.use(correlationMiddleware);

// 2. Security Mode Configuration
const SECURITY_MODE = process.env.SECURITY_MODE || "balanced";
console.log(`🛡️ [SYSTEM] Security Engine initialized in ${SECURITY_MODE} mode.`);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
// Webhooks must be registered before express.json() for raw body access
import webhookRoutes from "./routes/webhooks.js";
app.use("/api/v1/webhooks", webhookRoutes);

app.use(express.json());
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/purchases", purchaseRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/settings", settingRoutes);
app.use("/api/v1/hsn", hsnRoutes);
app.use("/api/v1/setup", setupRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/system", systemRoutes);
app.use("/api/v1/security", securityRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/export", exportRoutes);
app.use("/api/v1/audit-logs", auditLogRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/leaves", leaveRoutes);
app.use("/api/v1/documents", documentRoutes);

// Super Admin Routes
app.use("/api/v1/admin", authenticateToken, adminLogger);
app.use("/api/v1/admin/businesses", adminBusinessRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/admin/search", searchLimiter, adminSearchRoutes);
app.use("/api/v1/admin/impersonate", adminImpersonateRoutes);
app.use("/api/v1/admin/security", challengeLimiter, adminSecurityRoutes);
app.use("/api/v1/admin/godmode", adminGodModeRoutes);
app.use("/api/v1/admin/subscriptions", adminSubscriptionsRoutes);
app.use("/api/v1/admin/feature-flags", adminFeatureFlagsRoutes);
app.use("/api/v1/admin/integrations", adminIntegrationsRoutes);
app.use("/api/v1/admin/support", adminSupportRoutes);
app.use("/api/v1/admin/notifications", adminNotificationsRoutes);
app.use("/api/v1/admin/settings", adminSettingsRoutes);
app.use("/api/v1/admin/reports", adminReportsRoutes);
app.use("/api/v1/admin/plans", adminPlansRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Medisynex API is running" });
});

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", message: "Medisynex API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Medisynex API is running" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

console.log(`[SYSTEM] Attempting to start server on port ${PORT}...`);
try {
  app.listen(PORT, () => {
    console.log(`✅ [SYSTEM] Server is now listening on port ${PORT}`);
  }).on('error', (err) => {
    console.error(`❌ [SYSTEM] Server failed to start:`, err);
  });
} catch (err) {
  console.error(`❌ [SYSTEM] Fatal error during app.listen:`, err);
}
