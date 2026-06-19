import { subscriptionpayment_provider } from "@prisma/client";
export declare class WebhookService {
    /**
     * Log an incoming webhook event and check for idempotency
     * Returns null if the event was already processed
     */
    static recordEvent(provider: subscriptionpayment_provider, providerEventId: string, eventType: string, payload: any): Promise<any>;
    /**
     * Mark an event as successfully processed
     */
    static markProcessed(eventId: string): Promise<void>;
    /**
     * Mark an event as failed and schedule retry
     */
    static markFailed(eventId: string, error: string): Promise<void>;
}
//# sourceMappingURL=WebhookService.d.ts.map