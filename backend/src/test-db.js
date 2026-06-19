import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";
dotenv.config();
async function test() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not set");
        return;
    }
    try {
        const dbUrl = new URL(connectionString);
        const dbUser = dbUrl.username || 'root';
        const dbPassword = dbUrl.password || '';
        const dbHost = dbUrl.hostname || 'localhost';
        const dbPort = parseInt(dbUrl.port) || 3306;
        const dbName = dbUrl.pathname.slice(1);
        console.log(`[Test] Connecting to ${dbHost}:${dbPort}/${dbName}...`);
        const adapter = new PrismaMariaDb({
            host: dbHost,
            port: dbPort,
            user: dbUser,
            password: dbPassword,
            database: dbName,
        });
        const prisma = new PrismaClient({ adapter });
        const users = await prisma.user.findMany({ take: 1 });
        console.log("Connection successful! User count:", users.length);
    }
    catch (err) {
        console.error("Connection failed:", err);
    }
}
test();
//# sourceMappingURL=test-db.js.map