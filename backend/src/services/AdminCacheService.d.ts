/**
 * Lightweight in-memory cache for expensive administrative queries
 */
declare class AdminCacheService {
    private cache;
    /**
     * Set a cache value with TTL (default 5 minutes)
     */
    set(key: string, value: any, ttlSeconds?: number): void;
    /**
     * Get a cache value if not expired
     */
    get(key: string): any;
    /**
     * Invalidate specific key
     */
    invalidate(key: string): void;
    /**
     * Invalidate by prefix (e.g., all reports)
     */
    invalidatePrefix(prefix: string): void;
    /**
     * Clear entire cache
     */
    clear(): void;
}
export declare const adminCache: AdminCacheService;
export {};
//# sourceMappingURL=AdminCacheService.d.ts.map