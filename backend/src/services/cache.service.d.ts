export interface ICacheService {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlInSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
export declare class DbCacheService implements ICacheService {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlInSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
export declare const cacheService: DbCacheService;
//# sourceMappingURL=cache.service.d.ts.map