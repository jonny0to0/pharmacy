import prisma from "../db.js";

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlInSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class DbCacheService implements ICacheService {
  async get<T>(key: string): Promise<T | null> {
    const entry = await prisma.cacheentry.findUnique({
      where: { key },
    });

    if (!entry) return null;

    if (new Date() > entry.expiry) {
      await this.delete(key);
      return null;
    }

    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return entry.value as unknown as T;
    }
  }

  async set(key: string, value: any, ttlInSeconds: number = 3600): Promise<void> {
    const expiry = new Date(Date.now() + ttlInSeconds * 1000);
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    await prisma.cacheentry.upsert({
      where: { key },
      update: { value: stringValue, expiry },
      create: { key, value: stringValue, expiry },
    });
  }

  async delete(key: string): Promise<void> {
    try {
      await prisma.cacheentry.delete({
        where: { key },
      });
    } catch (e) {
      // Ignore if key doesn't exist
    }
  }

  async clear(): Promise<void> {
    await prisma.cacheentry.deleteMany({});
  }
}

export const cacheService = new DbCacheService();
