import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.js";
import { customerSchema } from "../validators/schemas.js";
import { randomUUID } from "crypto";

const router = express.Router();

// Get all active customers
router.get("/", authenticateToken, requirePermission(["CUSTOMERS.READ", "SALES.READ", "SALES.CREATE"]), async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { isDeleted: false, tenantId: req.user!.tenantId as string },
      orderBy: { createdAt: "desc" },
      include: {
        saleinvoice: {
          select: { id: true, grandTotal: true, status: true, date: true }
        }
      }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Create customer
router.post("/", authenticateToken, requirePermission("CUSTOMERS.CREATE"), validate(customerSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, phone, email, gst_number, address, state, customerType, creditLimit, creditDays, dob, gender, membershipType } = req.body;
    const tenantId = req.user!.tenantId;

    if (req.user!.roles.includes('PHARMACIST')) {
      const settings = await prisma.tenantsettings.findUnique({
        where: { tenantId: tenantId as string }
      });
      if (!settings?.allowPharmacistCustomerCreation) {
        return res.status(403).json({ message: "Pharmacists are not permitted to register customers under current settings." });
      }
    }

    if (phone) {
        const existing = await prisma.customer.findUnique({
        where: { phone_tenantId: { phone, tenantId: tenantId as string } }
        });

        if (existing) {
        if (existing.isDeleted) {
            return res.status(400).json({ message: "Customer with this phone already exists but was deleted. Contact support to restore." });
        }
        return res.status(400).json({ message: "Customer with this phone already exists" });
        }
    }

    const newCustomer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name,
        phone,
        email,
        gst_number,
        address,
        state,
        customerType: customerType || "regular",
        creditLimit: Number(creditLimit) || 0,
        creditDays: Number(creditDays) || 30,
        outstandingBalance: 0,
        isDeleted: false,
        tenantId: tenantId as string,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        membershipType: membershipType || "Regular",
        updatedAt: new Date()
      }
    });

    res.status(201).json({ message: "Customer created successfully", data: newCustomer });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to create customer", error: error.message });
  }
});

// Update customer
router.put("/:id", authenticateToken, requirePermission("CUSTOMERS.UPDATE"), validate(customerSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    const { name, phone, email, gst_number, address, state, customerType, creditLimit, creditDays, dob, gender, membershipType } = req.body;

    const customerRecord = await prisma.customer.findFirst({
        where: { id: id as string, tenantId: tenantId as string }
    });
    if (!customerRecord) return res.status(404).json({ message: "Customer not found or access denied" });

    if (phone) {
        const existing = await prisma.customer.findFirst({
        where: { phone: phone as string, tenantId: tenantId as string, id: { not: id as string } }
        });

        if (existing) {
        return res.status(400).json({ message: "Another customer with this phone number already exists." });
        }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (gst_number !== undefined) updateData.gst_number = gst_number;
    if (address !== undefined) updateData.address = address;
    if (state !== undefined) updateData.state = state;
    if (customerType !== undefined) updateData.customerType = customerType;
    if (creditLimit !== undefined) updateData.creditLimit = Number(creditLimit);
    if (creditDays !== undefined) updateData.creditDays = Number(creditDays);
    if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (membershipType !== undefined) updateData.membershipType = membershipType;
    updateData.updatedAt = new Date();

    const customer = await prisma.customer.update({
      where: { id: id as string },
      data: updateData
    });

    res.json({ message: "Customer updated successfully", data: customer });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to update customer", error: error.message });
  }
});

// Delete (Soft Delete) customer
router.delete("/:id", authenticateToken, requirePermission("CUSTOMERS.DELETE"), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const customerRecord = await prisma.customer.findFirst({
        where: { id: id as string, tenantId: tenantId as string }
    });
    if (!customerRecord) return res.status(404).json({ message: "Customer not found or access denied" });

    await prisma.customer.update({
      where: { id: id as string },
      data: { isDeleted: true, updatedAt: new Date() }
    });

    res.json({ message: "Customer deleted successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete customer", error: error.message });
  }
});

export default router;
