import { subscription_status, subscriptionevent_source } from "@prisma/client";
export declare class SubscriptionService {
    private static transitions;
    /**
     * Validate if a transition from current status to new status is allowed
     */
    static assertValidTransition(from: subscription_status, to: subscription_status): void;
    /**
     * Perform a status transition on a subscription (Hardened with Concurrency Locking)
     */
    static transition(subscriptionId: string, newStatus: subscription_status, options?: {
        reason?: string;
        performedBy?: string;
        source?: subscriptionevent_source;
        metadata?: any;
        tx?: any;
    }): Promise<any>;
    /**
     * Create a new subscription for a tenant (with snapshots)
     */
    static createSubscription(tenantId: string, planCode: string, billingCycle?: string, options?: {
        amount?: number;
        isLifetime?: boolean;
        performedBy?: string;
        tx?: any;
    }): Promise<any>;
    /**
     * Enrich subscription statistics for Admin Dashboard
     */
    static getAdminSubscriptions(page?: number, limit?: number): Promise<{
        items: {
            id: string;
            businessName: string;
            planName: string;
            status: import(".prisma/client").$Enums.subscription_status;
            usersCount: string;
            expiryDate: Date | null;
            isLifetime: boolean;
            billingCycle: string;
            amount: number;
            mrr: number;
        }[];
        total: number;
    }>;
}
//# sourceMappingURL=SubscriptionService.d.ts.map