import { sendEmail } from "./email.service.js";
import prisma from "../db.js";

interface OtpEntry {
  code: string;
  expiresAt: Date;
  attempts: number;
  purpose: string;
  targetId?: string;
  ipAddress?: string;
}

import { AlertingService } from "./AlertingService.js";

const otpStore = new Map<string, OtpEntry>();
const globalLockouts = new Map<string, { count: number; lastFailure: Date }>();

export class OtpService {
  /**
   * Generates and sends a 6-digit OTP to the user's email, bound to a specific action and IP
   */
  static async sendOtp(userId: string, purpose: string, targetId?: string, ipAddress?: string): Promise<{ success: boolean; message: string }> {
    if (this.isBlocked(userId)) {
        throw new Error("Temporary security lockout. Please try again in 15 minutes.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) {
      throw new Error("User not found or has no email address.");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    otpStore.set(userId, { code, expiresAt, attempts: 0, purpose, targetId, ipAddress });

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b; text-align: center;">Security Verification</h2>
        <p style="color: #475569; text-align: center;">A verification code was requested for: <strong>${purpose.replace('_', ' ')}</strong></p>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: 900; letter-spacing: 12px; color: #4f46e5; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">Context: ID ${targetId || 'GLOBAL'} • IP ${ipAddress || 'UNSPECIFIED'}</p>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Code expires in 5 minutes.</p>
      </div>
    `;

    await sendEmail(user.email, `Verification Code: ${purpose}`, htmlContent);
    return { success: true, message: "OTP sent to your registered email." };
  }

  /**
   * Verifies the OTP code for a user, ensuring it matches the intended purpose, target, and IP origin
   */
  static async verifyOtp(userId: string, code: string, purpose: string, targetId?: string, currentIp?: string): Promise<boolean> {
    const entry = otpStore.get(userId);

    if (!entry) return false;
    
    // 1. Expiry & Lockout
    if (entry.expiresAt.getTime() < Date.now()) {
      otpStore.delete(userId);
      return false;
    }

    if (entry.attempts >= 3) {
      this.recordFailure(userId);
      otpStore.delete(userId);
      throw new Error("Challenge failed too many times. Security lockout active.");
    }

    // 2. Multi-Factor Context Verification (Action + IP Origin)
    const isContextValid = 
        entry.purpose === purpose && 
        entry.targetId === targetId &&
        (process.env.SECURITY_MODE === 'strict' ? entry.ipAddress === currentIp : true);

    if (!isContextValid) {
      entry.attempts += 1;
      otpStore.set(userId, entry);
      await AlertingService.notify(`🚨 [AUTH_ANOMALY] Context mismatch for Admin ${userId}. IP mismatch or Purpose override attempt.`, "CRITICAL", `ANOMALY_${userId}`);
      throw new Error("Security verification purpose or origin mismatch. Access denied.");
    }

    // 3. Match Code
    if (entry.code === code) {
      otpStore.delete(userId);
      globalLockouts.delete(userId); // Reset on success
      return true;
    }

    entry.attempts += 1;
    otpStore.set(userId, entry);
    if (entry.attempts >= 3) this.recordFailure(userId);
    return false;
  }

  private static isBlocked(userId: string) {
    const lockout = globalLockouts.get(userId);
    if (!lockout) return false;
    if (lockout.count >= 3) {
        const timeSince = Date.now() - lockout.lastFailure.getTime();
        return timeSince < 15 * 60 * 1000; // 15 min cool-off
    }
    return false;
  }

  private static recordFailure(userId: string) {
    const current = globalLockouts.get(userId) || { count: 0, lastFailure: new Date() };
    current.count += 1;
    current.lastFailure = new Date();
    globalLockouts.set(userId, current);
    
    if (current.count >= 3) {
        AlertingService.notify(`🚨 [BRUTE-FORCE] Account ${userId} locked out from Administrative mutations after 3 failures.`, "CRITICAL", `LOCKOUT_${userId}`);
    }
  }
}
