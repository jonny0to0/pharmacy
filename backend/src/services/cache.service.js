import prisma from "../db.js";
export class DbCacheService {
    async get(key) {
        const entry = await prisma.cacheentry.findUnique({
            where: { key },
        });
        if (!entry)
            return null;
        if (new Date() > entry.expiry) {
            await this.delete(key);
            return null;
        }
        try {
            return JSON.parse(entry.value);
        }
        catch {
            return entry.value;
        }
    }
    async set(key, value, ttlInSeconds = 3600) {
        const expiry = new Date(Date.now() + ttlInSeconds * 1000);
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        await prisma.cacheentry.upsert({
            where: { key },
            update: { value: stringValue, expiry },
            create: { key, value: stringValue, expiry },
        });
    }
    async delete(key) {
        try {
            await prisma.cacheentry.delete({
                where: { key },
            });
        }
        catch (e) {
            // Ignore if key doesn't exist
        }
    }
    async clear() {
        await prisma.cacheentry.deleteMany({});
    }
}
export const cacheService = new DbCacheService();
//# sourceMappingURL=cache.service.js.map