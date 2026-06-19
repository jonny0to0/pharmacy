export declare class IntegrityService {
    /**
     * Initializes the security context and ensures platform keys are available
     */
    static initialize(): void;
    /**
     * Periodically traverses the entire hash chain to detect tampering
     */
    static verifyChainIntegrity(): Promise<{
        success: boolean;
        brokenAt?: string;
        message: string;
    }>;
    /**
     * Stores a signed anchor hash for daily state validation.
     * Replicates to HSM Isolated Store.
     */
    static createDailyAnchor(): Promise<void>;
    /**
     * Performs a deep content scan of the isolated HSM store
     */
    static verifyStorageIntegrity(): Promise<{
        success: boolean;
        failures: string[];
    }>;
    /**
     * Administrative Key Revocation
     */
    static revokeKey(keyId: string, reason: string): Promise<void>;
    private static verifyAgainstAnchor;
    private static reportViolation;
    private static extractOriginalDetails;
}
//# sourceMappingURL=IntegrityService.d.ts.map