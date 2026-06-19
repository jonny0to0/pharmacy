/**
 * Creates an immutable, hash-chained audit log entry
 * Risk Level: Platform Compliance & Tamper-Resistance
 */
export declare const createAuditLog: (userId: string | null, module: string, action: string, targetId?: string | null, details?: any, severity?: "INFO" | "WARNING" | "CRITICAL", ipAddress?: string, impersonatedBy?: string) => Promise<any>;
/**
 * Deep sequential verification of the entire Audit Log chain.
 * Detects: Missing records, Modified records, Broken sequence.
 */
export declare const verifyAuditChain: () => Promise<{
    status: string;
    totalLogs: any;
    errors: string[];
    timestamp: Date;
}>;
//# sourceMappingURL=auditService.d.ts.map