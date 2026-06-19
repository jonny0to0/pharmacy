/**
 * Security Thresholds & Operational Guardrails
 * These values define the platform's sensitivity to risk and operational urgency.
 */
export declare const SECURITY_THRESHOLDS: {
    GEO_SPEED_KMH: number;
    GEO_MIN_TIME_WINDOW_MS: number;
    OTP_EXPIRY_MIN: number;
    LOCKOUT_MIN: number;
    MAX_FAILURES: number;
    KEY_ROTATION_INTERVAL_DAYS: number;
    SUPPORTED_ALGORITHMS: string[];
    TARGET_MTTA_MIN: number;
    TARGET_MTTR_MIN: number;
};
/**
 * Feature Flags for Hardening & Redesign
 */
export declare const FEATURE_FLAGS: {
    FAILOVER_MODE_ENABLED: boolean;
    TRUSTED_DEVICES_ENABLED: boolean;
    INCIDENT_ANALYTICS_ENABLED: boolean;
    KEY_REVOCATION_ENABLED: boolean;
};
/**
 * Failover Simulation Config
 */
export declare const FAILOVER_CONFIG: {
    REGIONS: string[];
    LATENCY_INJECTION_MS: number;
};
/**
 * Trusted Device Config
 */
export declare const TRUSTED_DEVICE_CONFIG: {
    EXPIRY_DAYS: number;
    COOKIE_NAME: string;
};
/**
 * Platform Trust Domains
 */
export declare const TRUST_CONFIG: {
    PRIMARY_ANCHOR_DIR: string;
    SECURE_HSM_DIR: string;
};
//# sourceMappingURL=security.d.ts.map