export declare class BackupService {
    /**
     * Retrieves the latest backup status with RPO/RTO metrics and validation history.
     * RPO is calculated empirically based on current time vs last successful backup.
     */
    static getLatestStatus(): Promise<{
        lastSuccess: string;
        status: string;
        size: string;
        provider: string;
        metrics: {
            rpo: string;
            rto: string;
            lastValidation: string;
            geoRedundancy: string;
        };
        validation: {
            sanity: string;
            consistency: string;
            checksum: string;
            restoreSimulation: any;
        };
    }>;
    /**
     * Disaster Recovery (DR) Simulation
     * Tests both restore duration (RTO) and geo-replication consistency.
     */
    static runRestoreSimulation(): Promise<{
        verdict: string;
        duration: string;
    }>;
    static verifySanity(): Promise<"PASSED" | "FAILED: No Tenants" | "ERROR">;
    static verifyConsistency(): Promise<"DEGRADED" | "PASSED">;
}
//# sourceMappingURL=BackupService.d.ts.map