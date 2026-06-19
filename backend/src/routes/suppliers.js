import express, {} from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { supplierSchema } from "../validators/schemas.js";
import { randomUUID } from "crypto";
const router = express.Router();
// Helper to normalize strings to null if empty
const normalize = (val) => {
    if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === "" ? null : trimmed;
    }
    return val || null;
};
// Helper to safely parse dates
const safeDate = (val) => {
    if (!val || val === "")
        return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
};
// Get all suppliers
router.get("/", authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId)
            return res.status(401).json({ error: "Tenant context missing" });
        const suppliers = await prisma.supplier.findMany({
            where: { tenantId },
            include: {
                purchasebill: {
                    select: { id: true, grandTotal: true, status: true, date: true },
                    take: 5,
                    orderBy: { date: 'desc' }
                }
            }
        });
        const mappedSuppliers = suppliers.map((s) => ({
            ...s,
            purchases: s.purchasebill,
            purchasebill: undefined
        }));
        res.json(mappedSuppliers);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch suppliers" });
    }
});
// Get single supplier with ledger
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        if (!tenantId)
            return res.status(401).json({ error: "Tenant context missing" });
        const supplier = await prisma.supplier.findFirst({
            where: { id, tenantId },
            include: {
                supplierledger: {
                    orderBy: { date: 'desc' },
                    take: 50
                },
                purchasebill: {
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        });
        if (!supplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }
        const mappedSupplier = {
            ...supplier,
            ledgerEntries: supplier.supplierledger,
            purchases: supplier.purchasebill,
            supplierledger: undefined,
            purchasebill: undefined
        };
        res.json(mappedSupplier);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch supplier details" });
    }
});
// Create supplier
router.post("/", authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ error: "Access denied. Tenant context required for onboarding." });
        }
        const validated = supplierSchema.parse(req);
        const { name, type, mobile, email, gstin, drugLicenseNo, dlExpiry, pan, address, state } = validated.body;
        // Normalizing optional unique fields to NULL instead of empty strings
        const sanitizedMobile = normalize(mobile);
        const sanitizedEmail = normalize(email);
        // Manual pre-check for mobile to provide clean error
        if (sanitizedMobile) {
            const existing = await prisma.supplier.findFirst({
                where: { mobile: sanitizedMobile, tenantId }
            });
            if (existing) {
                return res.status(400).json({ error: "A vendor with this mobile number is already registered in your system." });
            }
        }
        const newSupplier = await prisma.supplier.create({
            data: {
                id: randomUUID(),
                name: name.trim(),
                type,
                mobile: sanitizedMobile,
                email: sanitizedEmail,
                gstin: normalize(gstin),
                drugLicenseNo: normalize(drugLicenseNo),
                dlExpiry: safeDate(dlExpiry),
                pan: normalize(pan),
                address: normalize(address),
                state: normalize(state),
                outstandingBalance: 0,
                tenantId,
                updatedAt: new Date()
            }
        });
        res.status(201).json(newSupplier);
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: error.errors[0].message });
        }
        // Handle Prisma DB Errors
        if (error.code === "P2002") {
            return res.status(400).json({
                error: "Database Conflict: This vendor information (possibly mobile or tax ID) already exists."
            });
        }
        console.error(`[Supplier Onboarding Crash]:`, {
            message: error.message,
            stack: error.stack,
            payload: req.body,
            tenantId: req.user?.tenantId
        });
        res.status(500).json({
            error: "Critical onboarding failure. Our engineers have been notified.",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Update supplier
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        if (!tenantId)
            return res.status(401).json({ error: "Tenant context missing" });
        const validated = supplierSchema.parse(req);
        const { name, type, mobile, email, gstin, drugLicenseNo, dlExpiry, pan, address, state } = validated.body;
        const existing = await prisma.supplier.findFirst({
            where: { id, tenantId }
        });
        if (!existing) {
            return res.status(404).json({ error: "Supplier record not found" });
        }
        const updatedSupplier = await prisma.supplier.update({
            where: { id },
            data: {
                name: name.trim(),
                type,
                mobile: normalize(mobile),
                email: normalize(email),
                gstin: normalize(gstin),
                drugLicenseNo: normalize(drugLicenseNo),
                dlExpiry: safeDate(dlExpiry),
                pan: normalize(pan),
                address: normalize(address),
                state: normalize(state),
                updatedAt: new Date()
            }
        });
        res.json(updatedSupplier);
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: error.errors[0].message });
        }
        if (error.code === "P2002") {
            return res.status(400).json({ error: "Conflict: Mobile number or license ID already assigned to another vendor." });
        }
        console.error(`[Supplier Update Failure]:`, error);
        res.status(500).json({ error: "Failed to update supplier profile." });
    }
});
// Delete supplier (Safety-critical)
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        if (!tenantId)
            return res.status(401).json({ error: "Tenant context missing" });
        const supplier = await prisma.supplier.findFirst({
            where: { id, tenantId },
            include: {
                _count: {
                    select: {
                        purchasebill: true,
                        supplierledger: true
                    }
                }
            }
        });
        if (!supplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }
        if (supplier._count.purchasebill > 0 || supplier._count.supplierledger > 0 || supplier.outstandingBalance !== 0) {
            return res.status(400).json({
                error: "Destructive Action Blocked: This vendor has active transaction history.",
                details: "Suppliers with bills or ledger entries cannot be removed. Please deactivate them instead."
            });
        }
        await prisma.supplier.delete({ where: { id } });
        res.json({ message: "Supplier record purged successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to remove supplier record" });
    }
});
export default router;
//# sourceMappingURL=suppliers.js.map