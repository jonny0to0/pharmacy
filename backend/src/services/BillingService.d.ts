export interface ProrationSnapshot {
    oldPrice: number;
    newPrice: number;
    daysRemaining: number;
    totalDays: number;
    calculatedCredit: number;
    upgradeCharge: number;
    timestamp: string;
}
export declare class BillingService {
    /**
     * Lock a subscription for processing to prevent race conditions
     */
    static lockSubscription(subscriptionId: string, externalTx?: any): Promise<void>;
    /**
     * Unlock a subscription
     */
    static unlockSubscription(subscriptionId: string): Promise<void>;
    /**
     * Calculate proration for an upgrade
     */
    static calculateUpgradeProration(subscriptionId: string, newPlanId: string): Promise<ProrationSnapshot>;
    /**
     * Schedule a downgrade for the end of the current billing cycle
     */
    static scheduleDowngrade(subscriptionId: string, targetPlanId: string, targetPlanVersion: number): Promise<any>;
    /**
     * Apply all pending changes that have reached their effective date
     */
    static applyPendingChanges(): Promise<void>;
    private static processPendingChange;
}
//# sourceMappingURL=BillingService.d.ts.map