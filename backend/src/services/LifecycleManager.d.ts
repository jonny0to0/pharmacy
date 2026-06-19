export declare class LifecycleManager {
    private static isRunning;
    /**
     * Main background task runner
     * Runs in a loop to process billing cycles, pending changes, and cleanups.
     */
    static runCycle(): Promise<void>;
    /**
     * Automatically retry webhooks that are in FAILED state and ready for retry
     */
    private static retryFailedWebhooks;
    /**
     * Mark subscriptions as EXPIRED if they reached their end date
     */
    private static processExpirations;
    /**
     * Cleanup old audit logs and webhook events (Policy: 90 days)
     */
    private static cleanupAuditLogs;
}
//# sourceMappingURL=LifecycleManager.d.ts.map