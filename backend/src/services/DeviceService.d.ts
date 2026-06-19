export declare class DeviceService {
    private static SECRET;
    /**
     * Generates a signed token for a trusted device
     */
    static generateToken(userId: string, deviceId: string): string;
    /**
     * Registers a device in the DB and returns the signed token
     */
    static registerDevice(userId: string, deviceName: string): Promise<string>;
    /**
     * Verifies if a token is valid and matches the user
     */
    static verifyDevice(userId: string, token: string): Promise<boolean>;
    /**
     * Revokes all trusted devices for a user
     */
    static revokeAll(userId: string): Promise<void>;
    /**
     * Lists all recognized hardware for a target user
     */
    static listUserDevices(userId: string): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
        deviceName: string | null;
        lastUsed: Date;
    }[]>;
    /**
     * Granular Revocation: Invalidates trust for a specific hardware id
     */
    static revokeDevice(id: string): Promise<void>;
}
//# sourceMappingURL=DeviceService.d.ts.map