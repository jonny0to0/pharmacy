export declare class OtpService {
    /**
     * Generates and sends a 6-digit OTP to the user's email, bound to a specific action and IP
     */
    static sendOtp(userId: string, purpose: string, targetId?: string, ipAddress?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Verifies the OTP code for a user, ensuring it matches the intended purpose, target, and IP origin
     */
    static verifyOtp(userId: string, code: string, purpose: string, targetId?: string, currentIp?: string): Promise<boolean>;
    private static isBlocked;
    private static recordFailure;
}
//# sourceMappingURL=OtpService.d.ts.map