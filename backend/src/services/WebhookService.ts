import prisma from "../db.js";
import { 
  webhookevent_status, 
  subscriptionpayment_provider 
} from "@prisma/client";

export class WebhookService {
  /**
   * Log an incoming webhook event and check for idempotency
   * Returns null if the event was already processed
   */
  public static async recordEvent(
    provider: subscriptionpayment_provider,
    providerEventId: string,
    eventType: string,
    payload: any
  ) {
    try {
      // 1. Check for existing event (Idempotency)
      const existing = await (prisma as any).webhookevent.findUnique({
        where: { providerEventId }
      });

      if (existing) {
        if (existing.status === webhookevent_status.PROCESSED) {
          console.log(`[WebhookService] Event ${providerEventId} already processed. Skipping.`);
          return null;
        }
        return existing;
      }

      // 2. record new event
      return await (prisma as any).webhookevent.create({
        data: {
          provider,
          providerEventId,
          eventType,
          payload: JSON.stringify(payload),
          status: webhookevent_status.PENDING
        }
      });
    } catch (error) {
      console.error("[WebhookService] ID check failed (likely race condition):", error);
      // Double check if it was created in the meantime
      return await (prisma as any).webhookevent.findUnique({
        where: { providerEventId }
      });
    }
  }

  /**
   * Mark an event as successfully processed
   */
  public static async markProcessed(eventId: string) {
    await (prisma as any).webhookevent.update({
      where: { id: eventId },
      data: {
        status: webhookevent_status.PROCESSED,
        processedAt: new Date(),
        error: null
      }
    });
  }

  /**
   * Mark an event as failed and schedule retry
   */
  public static async markFailed(eventId: string, error: string) {
    const event = await (prisma as any).webhookevent.findUnique({ where: { id: eventId } });
    
    const nextRetryAt = new Date();
    // Exponential backoff: 5m, 15m, 1h, 4h
    const backoffMinutes = [5, 15, 60, 240];
    const retryCount = (event?.retryCount || 0) + 1;
    const delay = backoffMinutes[Math.min(retryCount - 1, backoffMinutes.length - 1)];
    nextRetryAt.setMinutes(nextRetryAt.getMinutes() + delay);

    await (prisma as any).webhookevent.update({
      where: { id: eventId },
      data: {
        status: webhookevent_status.FAILED,
        retryCount,
        nextRetryAt,
        error: error.toString()
      }
    });
  }
}
