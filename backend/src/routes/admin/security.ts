import express, { type Request, type Response } from "express";
import { authenticateToken, authorizeRoles, sensitiveActionsLimiter } from "../../middleware/auth.js";
import { sendSuccess } from "../../utils/response.js";
import { OtpService } from "../../services/OtpService.js";
import prisma from "../../db.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("SUPER_ADMIN"));

/**
 * Step 1: Verify Password and Request Action-Bound OTP
 */
router.post("/challenge/initiate", sensitiveActionsLimiter, async (req: Request, res: Response): Promise<any> => {
  try {
    const { password, purpose, targetId } = req.body;
    const userId = req.user!.userId;

    if (!purpose) {
      return res.status(400).json({ error: "Verification purpose is mandatory." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User context lost." });

    const isValid = await bcrypt.compare(password, user.password || "");
    if (!isValid) {
      return res.status(401).json({ error: "Identity verification failed. Invalid password." });
    }

    await OtpService.sendOtp(userId, purpose, targetId);

    res.json({ success: true, message: "Security challenge Step 1 complete. OTP dispatched." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Security challenge initiation failed." });
  }
});

/**
 * Step 2: Verify Action-Bound OTP
 */
router.post("/challenge/verify", sensitiveActionsLimiter, async (req: Request, res: Response): Promise<any> => {
  try {
    const { code, purpose, targetId } = req.body;
    const userId = req.user!.userId;

    if (!purpose) {
      return res.status(400).json({ error: "Action purpose required for verification." });
    }

    const isValid = await OtpService.verifyOtp(userId, code, purpose, targetId);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid or expired security code." });
    }
    
    res.json({ 
        success: true, 
        message: "Identity verified. Administrative clearance granted.",
        challengeToken: "TEMP_ALLOW_" + Math.random().toString(36).slice(2) // Short-lived allowance
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

export default router;
