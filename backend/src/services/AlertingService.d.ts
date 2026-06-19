/**
 * Operational Incident Hub
 * Features: DB Persistence, Assignment, Post-Mortems, and SLA Tracking
 */
export interface AlertProvider {
    send(message: string, severity: 'INFO' | 'WARNING' | 'CRITICAL'): Promise<void>;
}
export declare class AlertingService {
    private static providers;
    private static cooldowns;
    static initialize(): void;
    /**
     * Internal notify: persist to DB and dispatch to providers
     */
    static notify(message: string, severity?: 'INFO' | 'WARNING' | 'CRITICAL', cooldownKey?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.incident_status;
        createdAt: Date;
        updatedAt: Date;
        severity: import(".prisma/client").$Enums.incident_severity;
        message: string;
        assignedToId: string | null;
        cooldownKey: string | null;
        count: number;
        notes: string | null;
        timeline: string | null;
        runbookUrl: string | null;
        acknowledgedAt: Date | null;
        resolvedAt: Date | null;
    } | undefined>;
    /**
     * Operational Transition: Assign Ownership (Acknowledgment)
     */
    static assign(id: string, adminId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.incident_status;
        createdAt: Date;
        updatedAt: Date;
        severity: import(".prisma/client").$Enums.incident_severity;
        message: string;
        assignedToId: string | null;
        cooldownKey: string | null;
        count: number;
        notes: string | null;
        timeline: string | null;
        runbookUrl: string | null;
        acknowledgedAt: Date | null;
        resolvedAt: Date | null;
    }>;
    /**
     * Operational Transition: Resolve
     */
    static resolve(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.incident_status;
        createdAt: Date;
        updatedAt: Date;
        severity: import(".prisma/client").$Enums.incident_severity;
        message: string;
        assignedToId: string | null;
        cooldownKey: string | null;
        count: number;
        notes: string | null;
        timeline: string | null;
        runbookUrl: string | null;
        acknowledgedAt: Date | null;
        resolvedAt: Date | null;
    } | undefined>;
    static getActiveIncidents(): Promise<({
        user: {
            name: string;
            id: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.incident_status;
        createdAt: Date;
        updatedAt: Date;
        severity: import(".prisma/client").$Enums.incident_severity;
        message: string;
        assignedToId: string | null;
        cooldownKey: string | null;
        count: number;
        notes: string | null;
        timeline: string | null;
        runbookUrl: string | null;
        acknowledgedAt: Date | null;
        resolvedAt: Date | null;
    })[]>;
    /**
     * Operational Intelligence Engine
     * Generates actionable insights from historical incident data.
     */
    static getIntelligenceReport(): Promise<{
        totalIncidents: number;
        slaBreachRate: string;
        slowestCategories: {
            name: string;
            avgMttr: string;
        }[];
        hotspots: {
            key: string | null;
            count: number;
        }[];
        targetSla: string;
    }>;
    /**
     * SLA Monitoring Poller
     * Check for:
     * - ACTIVE CRITICAL incidents older than 5 minutes (Ack target)
     * - ACTIVE WARNING incidents older than 15 minutes (Escalation target)
     */
    static runEscalationCheck(): Promise<void>;
}
//# sourceMappingURL=AlertingService.d.ts.map