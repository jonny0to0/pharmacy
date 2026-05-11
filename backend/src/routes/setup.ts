import express, { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../db.js";
import { randomUUID } from "crypto";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { businessProfileSchema, taxSettingsSchema } from "../validators/schemas.js";

const router = express.Router();

// Apply authentication to all setup routes
router.use(authenticateToken);

router.post("/complete-batch", async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId || req.body.tenantId;
  const { businessType, businessInfo, compliance, address, billing, users } = req.body;
  
  console.log("Setup Batch Request:", { 
    userId: req.user?.userId, 
    tenantId, 
    businessType,
    hasBusinessInfo: !!businessInfo,
    hasCompliance: !!compliance
  });

  if (!tenantId) {
    console.error("Setup failed: Missing tenantId in req.user");
    return res.status(400).json({ error: "Tenant ID required" });
  }

  // Map frontend IDs to backend enum if necessary
  const typeMapping: Record<string, any> = {
    'PHARMACY': 'PHARMACY',
    'HOSPITAL': 'HOSPITAL',
    'WHOLESALER': 'WHOLESALER',
    'RETAILER': 'RETAILER',
    'DISTRIBUTOR': 'DISTRIBUTOR',
    'MEDICAL_STORE': 'MEDICAL_STORE'
  };

  const mappedBusinessType = typeMapping[businessType] || 'PHARMACY';

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update Tenant Business Type
      await tx.tenant.update({
        where: { id: tenantId },
        data: { businessType: mappedBusinessType, isSetupCompleted: true }
      });

      // 2. Upsert Business Profile (Address combined)
      await tx.businessprofile.upsert({
        where: { tenantId },
        update: {
          businessName: businessInfo.name,
          ownerName: businessInfo.owner,
          phone: businessInfo.mobile,
          email: businessInfo.email,
          address: `${address.line1}, ${address.line2 || ""}`.replace(/, $/, ""),
          state: address.state,
          pinCode: address.pincode,
          pan: compliance.pan,
          drugLicense: compliance.drugLicense,
          fssai: compliance.fssai
        },
        create: {
          id: randomUUID(),
          tenantId,
          businessName: businessInfo.name,
          ownerName: businessInfo.owner,
          phone: businessInfo.mobile,
          email: businessInfo.email,
          address: `${address.line1}, ${address.line2 || ""}`.replace(/, $/, ""),
          state: address.state,
          pinCode: address.pincode,
          pan: compliance.pan,
          drugLicense: compliance.drugLicense,
          fssai: compliance.fssai
        }
      });

      // 3. Upsert Tax/Billing Settings
      await tx.taxsettings.upsert({
        where: { tenantId },
        update: {
          gstNumber: compliance.gst,
          taxType: "GST", // Default
          defaultCurrency: billing.currency,
          invoicePrefix: billing.invoicePrefix,
          paymentMethods: billing.paymentMethods.join(","),
          enableCreditLimit: billing.creditLimit,
          autoGstCalculation: billing.autoGst
        },
        create: {
          id: randomUUID(),
          tenantId,
          gstNumber: compliance.gst,
          taxType: "GST",
          defaultCurrency: billing.currency,
          invoicePrefix: billing.invoicePrefix,
          paymentMethods: billing.paymentMethods.join(","),
          enableCreditLimit: billing.creditLimit,
          autoGstCalculation: billing.autoGst
        }
      });

      // 4. Update Admin User (if password changed)
      if (users.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(users.password, salt);
        await tx.user.update({
          where: { id: req.user?.userId },
          data: { password: hashedPassword }
        });
      }

      // 5. Create Staff Users
      if (users.staff && users.staff.length > 0) {
        const salt = await bcrypt.genSalt(10);
        const defaultStaffPassword = await bcrypt.hash("Staff@123", salt);

        for (const staff of users.staff) {
          const staffRoleName = staff.role.toUpperCase();
          
          const newUser = await tx.user.create({
            data: {
              name: staff.name,
              email: `${staff.name.toLowerCase().replace(/\s/g, "")}@${businessInfo.name.toLowerCase().replace(/\s/g, "")}.com`,
              mobile: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
              password: defaultStaffPassword,
              role: staffRoleName as any,
              tenantId
            }
          });

          // Assign RBAC Role
          const roleToAssign = await tx.role.findFirst({
            where: { 
              name: staffRoleName,
              OR: [{ tenantId }, { tenantId: null, isSystem: true }]
            }
          });

          if (roleToAssign) {
            await tx.userrole.create({
              data: {
                userId: newUser.id,
                roleId: roleToAssign.id
              }
            });
          }
        }
      }

      // 6. Update Setup Progress
      await tx.tenantsettings.upsert({
        where: { tenantId },
        update: { businessProfileCompleted: true, taxCompleted: true, invoiceCompleted: true },
        create: { id: randomUUID(), tenantId, businessProfileCompleted: true, taxCompleted: true, invoiceCompleted: true }
      });
    });

    res.json({ success: true, message: "Workspace initialized successfully" });
  } catch (error: any) {
    console.error("BATCH_SETUP_CRITICAL_ERROR:", error);

    // Handle Prisma Specific Errors
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "A configuration with these details already exists.", errorCode: "CONFLICT" });
    }

    res.status(500).json({ 
      error: "Setup failed due to a server error. Please try again.", 
      errorCode: "INTERNAL_ERROR" 
    });
  }
});

router.post("/profile", validate(businessProfileSchema), async (req: Request, res: Response): Promise<any> => {
// ... existing profile endpoint (keeping for backward compatibility if needed)
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { businessName, ownerName, phone, email, address, state, pinCode, businessType } = req.body;

    await prisma.$transaction(async (tx) => {
      // Update Tenant businessType
      await tx.tenant.update({
        where: { id: tenantId },
        data: { businessType }
      });

      // Upsert Business Profile
      await tx.businessprofile.upsert({
        where: { tenantId },
        update: { businessName, ownerName, phone, email, address, state, pinCode },
        create: { id: randomUUID(), tenantId, businessName, ownerName, phone, email, address, state, pinCode }
      });

      // Update Setup Progress
      await tx.tenantsettings.update({
        where: { tenantId },
        data: { businessProfileCompleted: true }
      });
    });

    res.json({ message: "Business profile saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tax", validate(taxSettingsSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { gstNumber, taxType } = req.body;

    await prisma.$transaction(async (tx) => {
      // Upsert Tax Settings
      await tx.taxsettings.upsert({
        where: { tenantId },
        update: { gstNumber, taxType },
        create: { id: randomUUID(), tenantId, gstNumber, taxType }
      });

      // Update Setup Progress
      await tx.tenantsettings.update({
        where: { tenantId },
        data: { taxCompleted: true }
      });
    });

    res.json({ message: "Tax settings saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/complete", async (req: Request, res: Response): Promise<any> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { tenantsettings: true }
    });

    if (!tenant?.tenantsettings?.businessProfileCompleted) {
      return res.status(400).json({ error: "Mandatory steps not completed (Business Profile)" });
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isSetupCompleted: true }
    });

    res.json({ message: "Setup completed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/status", async (req: Request, res: Response): Promise<any> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const status = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { tenantsettings: true }
    });

    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
