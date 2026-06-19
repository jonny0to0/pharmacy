/**
 * Subscription & Billing System Configuration
 */
export declare const SUBSCRIPTION_CONFIG: {
    ENABLE_NEW_SUBSCRIPTIONS_READ: true;
    ENABLE_NEW_SUBSCRIPTIONS_WRITE: true;
    TRIAL_DAYS: number;
    DEFAULT_CURRENCY: string;
    MAX_FREE_USERS: number;
    ALLOWED_TRANSITIONS: {
        INACTIVE: string[];
        TRIAL: string[];
        ACTIVE: string[];
        PAST_DUE: string[];
        SUSPENDED: string[];
        CANCELLED: never[];
        EXPIRED: string[];
    };
};
//# sourceMappingURL=subscriptions.d.ts.map