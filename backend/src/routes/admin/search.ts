import express, { type Request, type Response } from "express";
import prisma from "../../db.js";
import { sendSuccess } from "../../utils/response.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("SUPER_ADMIN"));

/**
 * Global Administrative Search (Hardened)
 * Features: Multi-field discovery, Typo-tolerance, and Subscription indexing
 */
router.get("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const { q: query } = req.query;
    if (!query || typeof query !== "string") {
      return sendSuccess(res, { tenants: [], users: [], subscriptions: [] });
    }

    const queryStr = query.toLowerCase();
    
    // 1. Search Tenants (Enhanced with email/phone/id/fuzzy-like)
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { businessName: { contains: queryStr, mode: 'insensitive' } },
          { id: { startsWith: queryStr } },
          { businessprofile: { email: { contains: queryStr, mode: 'insensitive' } } },
          { businessprofile: { phone: { contains: queryStr } } },
          queryStr.length > 3 ? { businessName: { startsWith: queryStr.slice(0, 3), mode: 'insensitive' } } : {}
        ]
      },
      include: {
        businessprofile: true,
        subscription: true
      },
      take: 10
    });

    // 2. Search Users (Global Scope)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: queryStr, mode: 'insensitive' } },
          { email: { contains: queryStr, mode: 'insensitive' } },
          { mobile: { contains: queryStr } }
        ]
      },
      include: {
          tenant: { select: { businessName: true } },
          userrole: { include: { role: true } }
      },
      take: 10
    });

    // 3. Search Subscriptions (by ID or Status)
    const subscriptions = await prisma.subscription.findMany({
        where: {
            OR: [
                { id: { startsWith: queryStr } },
                { planName: { contains: queryStr, mode: 'insensitive' } }
            ]
        },
        include: {
            tenant: { select: { businessName: true } }
        },
        take: 5
    });

    const data = {
      tenants: tenants.map(t => ({ 
          id: t.id, 
          name: t.businessName, 
          type: t.businessType,
          status: t.subscription?.status || 'UNKNOWN',
          owner: t.businessprofile?.ownerName
      })),
      users: users.map(u => ({ 
          id: u.id, 
          name: u.name, 
          email: u.email, 
          role: u.userrole[0]?.role.name || 'USER',
          business: u.tenant?.businessName || 'Platform Admin'
      })),
      subscriptions: subscriptions.map(s => ({
          id: s.id,
          plan: s.planName,
          status: s.status,
          business: s.tenant.businessName
      })),
      meta: {
          query: queryStr,
          timestamp: new Date().toISOString()
      }
    };

    return sendSuccess(res, data);
  } catch (error) {
    console.error("[Admin Search] Error:", error);
    res.status(500).json({ success: false, error: "Search failed" });
  }
});

export default router;
