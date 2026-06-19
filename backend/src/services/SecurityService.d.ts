export declare class SecurityService {
    /**
     * Tracks a failed login attempt and applies tiered escalation logic.
     */
    static recordFailedAttempt(identifier: string, ip: string): Promise<{
        status: string;
        expiry: Date;
        count?: never;
    } | {
        status: string;
        count: number;
        expiry?: never;
    }>;
    /**
     * Checks if an identifier/IP pair is currently locked out.
     */
    static isLockedOut(identifier: string, ip: string): {
        locked: boolean;
        expiry?: Date;
    };
    /**
     * Resets attempts on successful login.
     */
    static resetAttempts(identifier: string, ip: string): void;
}
//# sourceMappingURL=SecurityService.d.ts.map