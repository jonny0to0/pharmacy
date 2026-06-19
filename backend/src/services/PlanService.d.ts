export declare class PlanService {
    /**
     * Get all active and current plans with their feature and limit definitions
     */
    static getPublicPlans(): Promise<any[]>;
    /**
     * Get all plans for admin management (all versions)
     */
    static getAdminPlans(): Promise<any[]>;
    /**
     * Get effective plan for a tenant (from subscription snapshot)
     */
    static getTenantPlanSnapshot(tenantId: string): Promise<{
        features: Record<string, boolean>;
        limits: Record<string, number>;
        planId: string | null;
        version: number;
        status: import(".prisma/client").$Enums.subscription_status;
    } | null>;
    /**
     * Generate strict snapshots for a plan to be stored in a subscription
     */
    static generateSnapshots(planId: string, tx?: any): Promise<{
        featuresSnapshot: Record<string, boolean>;
        limitsSnapshot: Record<string, number>;
        planVersion: any;
        planName: any;
    }>;
    /**
     * Create a new version of an existing plan (Grandfathering Strategy)
     */
    static createNewVersion(code: string, data: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: import(".prisma/client").$Enums.plan_type;
        description: string | null;
        isDefault: boolean;
        billingCycle: string;
        code: string;
        version: number;
        price: number;
        changeLog: string | null;
        isCurrent: boolean;
    }>;
    /**
     * Deactivate a plan (prevents new signups)
     */
    static deactivatePlan(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: import(".prisma/client").$Enums.plan_type;
        description: string | null;
        isDefault: boolean;
        billingCycle: string;
        code: string;
        version: number;
        price: number;
        changeLog: string | null;
        isCurrent: boolean;
    }>;
}
//# sourceMappingURL=PlanService.d.ts.map