import prisma from '../db.js';
import crypto from 'crypto';

export type PlatformMode = 'NORMAL' | 'DEGRADED' | 'INCIDENT' | 'FAILOVER';

interface DrillResult {
  timestamp: string;
  duration: string;
  verdict: 'SUCCESS' | 'FAILED' | 'DEGRADED';
  issues?: string[];
}

export class PlatformStateService {
  private static currentMode: PlatformMode = 'NORMAL';

  /**
   * Retrieves the current situational awareness mode
   */
  static async getSystemMode(): Promise<PlatformMode> {
    // Logic: If there are active CRITICAL incidents, mode is INCIDENT.
    // If failover simulation is active in cache, mode is FAILOVER.
    const criticalCount = await prisma.incident.count({
      where: { severity: 'CRITICAL', status: { not: 'RESOLVED' } }
    });

    if (criticalCount > 0) return 'INCIDENT';
    
    // Check for failover state (memoized or from DB)
    return this.currentMode;
  }

  static setMode(mode: PlatformMode) {
    this.currentMode = mode;
    console.log(`🌐 [PLATFORM] Mode transition: ${mode}`);
  }

  /**
   * Disaster Recovery Drill Registry
   */
  static async recordDrillResult(result: DrillResult) {
    const key = 'LAST_DR_DRILL';
    // Persist to a system setting or cache entry
    await prisma.cacheentry.upsert({
      where: { key },
      update: { value: JSON.stringify(result), expiry: new Date(Date.now() + 365 * 86400000) },
      create: { 
        key, 
        value: JSON.stringify(result), 
        expiry: new Date(Date.now() + 365 * 86400000) 
      }
    });
  }

  static async getLastDrill(): Promise<DrillResult | null> {
    const entry = await prisma.cacheentry.findUnique({ where: { key: 'LAST_DR_DRILL' } });
    return entry ? (JSON.parse(entry.value) as DrillResult) : null;
  }
}
