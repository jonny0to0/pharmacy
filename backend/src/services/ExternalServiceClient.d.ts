interface ServiceOptions {
    service: string;
    endpoint: string;
    requestId?: string;
    timeoutMs?: number;
    retries?: number;
}
export declare class ExternalServiceClient {
    private static DEFAULT_TIMEOUT;
    private static DEFAULT_RETRIES;
    /**
     * Highly-reliable wrapper for simulated external calls (Payments, HSM, KMS)
     * Ensures trace continuity and normalized observability.
     */
    static call(options: ServiceOptions, payload?: any): Promise<any>;
    /**
     * Helper for specific common external interactions
     */
    static chargePayment(requestId: string, amount: number): Promise<any>;
    static pushHsmAnchor(requestId: string, anchorId: string, payload: any): Promise<any>;
}
export {};
//# sourceMappingURL=ExternalServiceClient.d.ts.map