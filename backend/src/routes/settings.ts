import express, { type Request, type Response } from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import storageService from "../services/storageService.js";
import { randomUUID } from "crypto";
const router = express.Router();

// Get Full Business Settings (Tenant + Profile + Tax)
router.get("/full-profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      console.error("Full Profile Error: No user in request");
      return res.status(401).json({ error: "Unauthorized: No user found in session" });
    }

    const tenantId = user.tenantId;
    const userId = user.userId;

    console.log(`Fetching full profile for Tenant: ${tenantId}, User: ${userId}`);

    if (!tenantId) {
      console.warn(`User ${userId} has no associated tenantId in token`);
      return res.status(400).json({ 
        error: "Business context missing", 
        message: "You haven't completed the business setup yet. Please complete the setup wizard." 
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        businessprofile: true,
        taxsettings: true,
        tenantsettings: true,
        user: {
          where: { id: userId }
        }
      }
    });

    if (!tenant) {
      console.error(`Tenant ${tenantId} not found in database for user ${userId}`);
      return res.status(404).json({ 
        error: "Business data not found",
        message: "Your business profile could not be found. If you just registered, please finish the setup."
      });
    }

    // Explicitly construct response to avoid Prisma object issues
    const responseData: any = JSON.parse(JSON.stringify(tenant));
    
    // Map back to maintain API compatibility
    responseData.profile = tenant.businessprofile;
    responseData.taxSettings = tenant.taxsettings;
    responseData.settings = tenant.tenantsettings;
    responseData.users = tenant.user;
    responseData.currentUser = null;

    // Process Profile Images
    if (tenant.businessprofile) {
      responseData.profile = {
        ...responseData.profile,
        logo: storageService.getImageUrlObject(tenant.businessprofile.logoKey),
        banner: storageService.getImageUrlObject(tenant.businessprofile.bannerKey)
      };
    }

    // Process Current User Info (ensure we have it)
    const dbUser = tenant.user && tenant.user.length > 0 ? tenant.user[0] : null;
    if (dbUser) {
      responseData.currentUser = {
        ...JSON.parse(JSON.stringify(dbUser)),
        avatar: storageService.getImageUrlObject(dbUser.avatarKey)
      };
    } else {
      // Fallback: try to find user independently if not found through tenant relation
      const fallbackUser = await prisma.user.findUnique({ where: { id: userId } });
      if (fallbackUser) {
        responseData.currentUser = {
          ...JSON.parse(JSON.stringify(fallbackUser)),
          avatar: storageService.getImageUrlObject(fallbackUser.avatarKey)
        };
      }
    }

    res.json(responseData);
  } catch (error: any) {
    console.error("Full Profile Critical Error:", error);
    res.status(500).json({ 
      error: "Internal server error fetching profile",
      message: error.code === 'P2021' 
        ? "Database schema out of sync. Please run migrations." 
        : (error?.message || "Unknown error"),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update Business Profile (Advanced)
router.post("/profile", authenticateToken, requirePermission("SETTINGS_BUSINESS.UPDATE"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { 
      businessName, ownerName, phone, email, 
      address, state, pinCode, logoKey, bannerKey,
      pan, drugLicense, fssai,
      gstUrl, drugLicenseUrl, panUrl, fssaiUrl
    } = req.body;

    // Logic: If a URL or License number changes, we reset status to PENDING
    const currentProfile = await prisma.businessprofile.findUnique({ where: { tenantId } });
    if (!currentProfile) return res.status(404).json({ error: "Business profile not found" });

    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: { businessName }
      }),
      prisma.businessprofile.upsert({
        where: { tenantId },
        update: { 
          businessName, ownerName, phone, email, address, state, pinCode, logoKey, bannerKey,
          pan, drugLicense, fssai,
          gstUrl, drugLicenseUrl, panUrl, fssaiUrl,
          // Auto-reset status if URL changes
          gstStatus: (gstUrl && gstUrl !== currentProfile?.gstUrl) ? 'PENDING' : undefined,
          drugLicenseStatus: (drugLicenseUrl && drugLicenseUrl !== currentProfile?.drugLicenseUrl) ? 'PENDING' : undefined,
          panStatus: (pan && pan !== currentProfile?.pan) ? 'PENDING' : undefined,
        },
        create: { 
          id: randomUUID(), // Ensure ID is provided for create
          tenantId, businessName, ownerName, phone, email, address, state, pinCode, logoKey, bannerKey,
          pan, drugLicense, fssai,
          gstUrl, drugLicenseUrl, panUrl, fssaiUrl
        }
      })
    ]);

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// Update Tax & Billing Settings
router.post("/tax-billing", authenticateToken, requirePermission("SETTINGS_BUSINESS.UPDATE"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { gstNumber, invoicePrefix, paymentMethods, defaultCurrency, autoGstCalculation } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    await prisma.taxsettings.upsert({
      where: { tenantId },
      update: { gstNumber, invoicePrefix, paymentMethods, defaultCurrency, autoGstCalculation },
      create: { 
        id: randomUUID(),
        tenantId, gstNumber, invoicePrefix, paymentMethods, defaultCurrency, autoGstCalculation 
      }
    });

    res.json({ message: "Tax and billing settings updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update tax settings" });
  }
});

// Update Module Settings (Toggles)
router.post("/modules", authenticateToken, requirePermission("SETTINGS_BUSINESS.UPDATE"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { enableMedicalInfo, walkInCustomerBehavior, allowPharmacistCustomerCreation } = req.body;

    await prisma.tenantsettings.upsert({
      where: { tenantId },
      update: { enableMedicalInfo, walkInCustomerBehavior, allowPharmacistCustomerCreation },
      create: { id: randomUUID(), tenantId, enableMedicalInfo, walkInCustomerBehavior, allowPharmacistCustomerCreation }
    });

    res.json({ message: "Module settings updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update module settings" });
  }
});

// Update Personal Profile (User Avatar, Name, Email)
router.post("/personal-profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, email, avatarKey } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email, avatarKey }
    });

    res.json({ 
      message: "Personal profile updated successfully", 
      user: {
        ...updatedUser,
        avatar: storageService.getImageUrlObject(updatedUser.avatarKey)
      } 
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Email already taken" });
    }
    res.status(500).json({ error: "Failed to update personal profile" });
  }
});

export default router;
