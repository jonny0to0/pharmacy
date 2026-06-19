/**
 * Storage Isolation Service (Simulated HSM/S3 with Object Lock)
 * Enforces: Append-only behavior, immutability, and path restriction.
 */
export declare class StorageIsolationService {
    private static SECURE_DIR;
    static initialize(): void;
    /**
     * Pushes an anchor to the isolated store.
     * Fails if the file already exists (Immutability).
     */
    static pushAnchor(filename: string, content: string): Promise<{
        path: string;
        timestamp: string;
        location: string;
    }>;
    static listAnchors(): Promise<string[]>;
    /**
     * Deep Integrity Scan of HSM Store
     * Verifies that all physical files match their intended content structure.
     */
    static verifyStorageIntegrity(): Promise<{
        success: boolean;
        failures: string[];
    }>;
    static readAnchor(filename: string): string | null;
}
//# sourceMappingURL=StorageIsolationService.d.ts.map