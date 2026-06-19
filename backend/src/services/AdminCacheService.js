/**
 * Lightweight in-memory cache for expensive administrative queries
 */
class AdminCacheService {
    cache = new Map();
    /**
     * Set a cache value with TTL (default 5 minutes)
     */
    set(key, value, ttlSeconds = 300) {
        const expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiry });
    }
    /**
     * Get a cache value if not expired
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    /**
     * Invalidate specific key
     */
    invalidate(key) {
        this.cache.delete(key);
    }
    /**
     * Invalidate by prefix (e.g., all reports)
     */
    invalidatePrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Clear entire cache
     */
    clear() {
        this.cache.clear();
    }
}
export const adminCache = new AdminCacheService();
//# sourceMappingURL=AdminCacheService.js.map