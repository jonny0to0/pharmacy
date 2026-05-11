/**
 * Security Thresholds & Operational Guardrails
 * These values define the platform's sensitivity to risk and operational urgency.
 */
export const SECURITY_THRESHOLDS = {
  // Geo-Velocity & Authentication
  GEO_SPEED_KMH: 900,          // Impossible travel > current commercial flight speeds
  GEO_MIN_TIME_WINDOW_MS: 300000, // 5 minutes minimum between location updates for calculation
  
  // Administrative Challenges
  OTP_EXPIRY_MIN: 5,
  LOCKOUT_MIN: 15,
  MAX_FAILURES: 3,
  
  // Cryptographic Lifecycle
  KEY_ROTATION_INTERVAL_DAYS: 90,
  SUPPORTED_ALGORITHMS: ['rsa', 'sha256'],
  
  // Operational SLAs
  TARGET_MTTA_MIN: 5,          // 5 minutes to Acknowledge Criticals
  TARGET_MTTR_MIN: 15,         // 15 minutes to Resolve Warning/Criticals
};

/**
 * Feature Flags for Hardening & Redesign
 */
export const FEATURE_FLAGS = {
  FAILOVER_MODE_ENABLED: true,
  TRUSTED_DEVICES_ENABLED: true,
  INCIDENT_ANALYTICS_ENABLED: true,
  KEY_REVOCATION_ENABLED: true,
};

/**
 * Failover Simulation Config
 */
export const FAILOVER_CONFIG = {
  REGIONS: ["ap-south-1", "eu-central-1"],
  LATENCY_INJECTION_MS: 150,
};

/**
 * Trusted Device Config
 */
export const TRUSTED_DEVICE_CONFIG = {
  EXPIRY_DAYS: 7,
  COOKIE_NAME: "medisynex_trusted_id",
};

/**
 * Platform Trust Domains
 */
export const TRUST_CONFIG = {
  PRIMARY_ANCHOR_DIR: 'data/anchors-db',
  SECURE_HSM_DIR: 'secure-hsm-store', // Simulated external append-only store
};
