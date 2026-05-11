/**
 * Subscription & Billing System Configuration
 */
export const SUBSCRIPTION_CONFIG = {
  // Set to true to use the new Industrial Billing infrastructure for READ operations
  ENABLE_NEW_SUBSCRIPTIONS_READ: process.env.ENABLE_NEW_SUBSCRIPTIONS_READ === 'true' || true,
  
  // Set to true to allow WRITE operations via the new SubscriptionService
  ENABLE_NEW_SUBSCRIPTIONS_WRITE: process.env.ENABLE_NEW_SUBSCRIPTIONS_WRITE === 'true' || true,

  TRIAL_DAYS: 14,
  DEFAULT_CURRENCY: 'INR',
  
  // Hard limits or business rules
  MAX_FREE_USERS: 1,
  
  // Transition map for easy reference in other modules
  ALLOWED_TRANSITIONS: {
    INACTIVE: ['TRIAL', 'ACTIVE'],
    TRIAL: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
    ACTIVE: ['SUSPENDED', 'CANCELLED', 'PAST_DUE'],
    PAST_DUE: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
    SUSPENDED: ['ACTIVE', 'CANCELLED'],
    CANCELLED: [],
    EXPIRED: ['ACTIVE'],
  }
};
