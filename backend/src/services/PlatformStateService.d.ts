export type PlatformMode = 'NORMAL' | 'DEGRADED' | 'INCIDENT' | 'FAILOVER';
interface DrillResult {
    timestamp: string;
    duration: string;
    verdict: 'SUCCESS' | 'FAILED' | 'DEGRADED';
    issues?: string[];
}
export declare class PlatformStateService {
    private static currentMode;
    /**
     * Retrieves the current situational awareness mode
     */
    static getSystemMode(): Promise<PlatformMode>;
    static setMode(mode: PlatformMode): void;
    /**
     * Disaster Recovery Drill Registry
     */
    static recordDrillResult(result: DrillResult): Promise<void>;
    static getLastDrill(): Promise<DrillResult | null>;
}
export {};
//# sourceMappingURL=PlatformStateService.d.ts.map