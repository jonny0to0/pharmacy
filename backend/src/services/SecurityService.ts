import { AlertingService } from "./AlertingService.js";

interface AttemptRecord {
  count: number;
  lastAttempt: Date;
}

const loginAttempts = new Map<string, AttemptRecord>();
const lockouts = new Map<string, Date>();

export class SecurityService {
  /**
   * Tracks a failed login attempt and applies tiered escalation logic.
   */
  static async recordFailedAttempt(identifier: string, ip: string) {
    const key = `${identifier}:${ip}`;
    const now = new Date();
    
    // 1. Get current record
    const record = loginAttempts.get(key) || { count: 0, lastAttempt: now };
    
    // Reset if last attempt was > 5 minutes ago
    if (now.getTime() - record.lastAttempt.getTime() > 5 * 60 * 1000) {
      record.count = 0;
    }
    
    record.count += 1;
    record.lastAttempt = now;
    loginAttempts.set(key, record);

    // 2. Tiered Escalation
    if (record.count >= 10) {
      // 🚨 CRITICAL Level: 10 fails / 5min
      const lockoutExpiry = new Date(now.getTime() + 15 * 60 * 1000); // 15-min lockout
      lockouts.set(key, lockoutExpiry);
      
      await AlertingService.notify(
        `🚨 [SECURITY_CRITICAL] Brute force detected for ${identifier} from IP ${ip}. Account locked for 15 minutes.`,
        "CRITICAL",
        `LOCKOUT_${key}`
      );
      
      return { status: "LOCKED", expiry: lockoutExpiry };
    } 
    
    if (record.count >= 5) {
      // 🟠 WARNING Level: 5 fails / 1min
      await AlertingService.notify(
        `🟠 [SECURITY_WARNING] Multiple failed login attempts for ${identifier} from IP ${ip}.`,
        "WARNING",
        `BRUTE_WARN_${key}`
      );
      
      return { status: "WARNING", count: record.count };
    }

    return { status: "OK", count: record.count };
  }

  /**
   * Checks if an identifier/IP pair is currently locked out.
   */
  static isLockedOut(identifier: string, ip: string): { locked: boolean; expiry?: Date } {
    const key = `${identifier}:${ip}`;
    const expiry = lockouts.get(key);
    
    if (expiry) {
      if (expiry.getTime() > Date.now()) {
        return { locked: true, expiry };
      } else {
        lockouts.delete(key); // Cleanup expired lockout
      }
    }
    
    return { locked: false };
  }

  /**
   * Resets attempts on successful login.
   */
  static resetAttempts(identifier: string, ip: string) {
    loginAttempts.delete(`${identifier}:${ip}`);
    lockouts.delete(`${identifier}:${ip}`);
  }
}
