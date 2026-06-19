export declare class KeyManagementService {
    private static manifest;
    /**
     * Initializes the key directory and loads the manifest
     */
    static initialize(): void;
    /**
     * Generates a new RSA-4096 key pair and updates the manifest
     */
    static rotateKey(reason: string): string;
    /**
     * Immediately invalidates a key for signing
     */
    static revokeKey(id: string, reason: string): void;
    static getActiveKey(): {
        id: string;
        privateKey: string;
        publicKey: string;
    };
    static getPublicKey(id: string): string;
    static listKeys(): {
        id: string;
        createdAt: string;
        status: "active" | "archived" | "revoked";
    }[];
    /**
     * Diagnostic: Assessment of revocation blast radius
     */
    static getKeyImpactReport(id: string): {
        id: string;
        anchorCount: any;
        estimatedLogs: number;
        lastUsedAt: any;
        isHighlyExposed: boolean;
    };
    private static saveManifest;
    private static ensureInitialized;
}
//# sourceMappingURL=KeyManagementService.d.ts.map