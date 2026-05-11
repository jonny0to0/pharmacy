import prisma from "../db.js";
import { BillingService } from "./BillingService.js";
import { webhookevent_status } from "@prisma/client";
import { WebhookService } from "./WebhookService.js";

export class LifecycleManager {
  private static isRunning = false;

  /**
   * Main background task runner
   * Runs in a loop to process billing cycles, pending changes, and cleanups.
   */
  public static async runCycle() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      console.log("🕒 [Lifecycle] Starting background cycle...");

      // 1. Process Pending Plan Changes (Downgrades/Upgrades scheduled for renewal)
      await BillingService.applyPendingChanges();

      // 2. Retry Failed Webhook Events (Self-healing async system)
      await this.retryFailedWebhooks();

      // 3. Subscription Expiry Check (Idempotent state transition)
      await this.processExpirations();

      // 4. Audit Retention Cleanup (Hot storage management - 90 days)
      await this.cleanupAuditLogs();

      console.log("✅ [Lifecycle] Background cycle completed successfully.");
    } catch (error) {
      console.error("❌ [Lifecycle] Error during background cycle:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Automatically retry webhooks that are in FAILED state and ready for retry
   */
  private static async retryFailedWebhooks() {
    const now = new Date();
    const retryableEvents = await (prisma as any).webhookevent.findMany({
      where: {
        status: webhookevent_status.FAILED,
        nextRetryAt: { lte: now },
        retryCount: { lt: 5 } // Max 5 retries
      },
      take: 20
    });

    if (retryableEvents.length === 0) return;

    console.log(`[Lifecycle] Retrying ${retryableEvents.length} failed webhooks...`);
    // Note: Actual processing would call the webhook handler again
    // For now, we just log and the specific router would handle the retry logic
  }

  /**
   * Mark subscriptions as EXPIRED if they reached their end date
   */
  private static async processExpirations() {
    const now = new Date();
    const expiredSubs = await (prisma as any).subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
        autoRenew: false
      },
      take: 50
    });

    for (const sub of expiredSubs) {
      // Idempotent transition to EXPIRED
      await (prisma as any).subscription.update({
        where: { id: sub.id },
        data: { 
            status: 'EXPIRED',
            updatedAt: new Date()
        }
      });
      
      // Audit Log
      await (prisma as any).subscriptionevent.create({
          data: {
              subscriptionId: sub.id,
              newState: 'EXPIRED',
              eventType: 'AUTO_EXPIRED',
              source: 'SYSTEM',
              reason: 'Plan reached end of term without auto-renew.'
          }
      });
    }
  }

  /**
   * Cleanup old audit logs and webhook events (Policy: 90 days)
   */
  private static async cleanupAuditLogs() {
    const retentionDays = 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    // 1. Cleanup Webhook Events (Archive could be done here in prod)
    const deletedEvents = await (prisma as any).webhookevent.deleteMany({
      where: {
        processedAt: { lt: cutoff },
        status: webhookevent_status.PROCESSED
      }
    });

    // 2. Cleanup Old Subscription Events (Keep high-level history, purge noisy metadata?)
    // For now, we keep it simple.
    
    if (deletedEvents.count > 0) {
        console.log(`[Lifecycle] Cleaned up ${deletedEvents.count} old processed webhook events.`);
    }
  }
}
