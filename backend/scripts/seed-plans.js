import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";
dotenv.config();
const setupPrisma = () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString)
        throw new Error("DATABASE_URL is not set");
    const dbUrl = new URL(connectionString);
    const adapter = new PrismaMariaDb({
        host: dbUrl.hostname || 'localhost',
        port: parseInt(dbUrl.port) || 3306,
        user: dbUrl.username || 'root',
        password: dbUrl.password || '',
        database: dbUrl.pathname.slice(1),
    });
    return new PrismaClient({ adapter });
};
const prisma = setupPrisma();
async function main() {
    console.log("🌱 Seeding versioned plans...");
    const plans = [
        {
            code: "FREE",
            version: 1,
            name: "Free Forever",
            price: 0,
            billingCycle: "LIFETIME",
            features: {
                users: 1,
                invoices: "unlimited",
                support: "community",
            },
            isDefault: true,
        },
        {
            code: "PRO",
            version: 1,
            name: "Professional Business",
            price: 999,
            billingCycle: "MONTHLY",
            features: {
                users: 10,
                invoices: "unlimited",
                support: "priority",
                analytics: true,
            },
        },
        {
            code: "ENTERPRISE",
            version: 1,
            name: "Enterprise Multi-Branch",
            price: 4999,
            billingCycle: "MONTHLY",
            features: {
                users: "unlimited",
                invoices: "unlimited",
                support: "dedicated",
                custom_domain: true,
            },
        },
    ];
    for (const plan of plans) {
        await prisma.plan.upsert({
            where: {
                code_version: {
                    code: plan.code,
                    version: plan.version,
                },
            },
            update: plan,
            create: plan,
        });
        console.log(`✅ Plan ${plan.code} v${plan.version} upserted.`);
    }
    console.log("🏁 Seeding complete.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-plans.js.map