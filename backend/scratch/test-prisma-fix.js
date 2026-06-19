import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { createPool } from "mariadb";
import dotenv from "dotenv";
dotenv.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL not found");
    process.exit(1);
}
const dbUrl = new URL(connectionString);
const pool = createPool({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port) || 3306,
    user: dbUrl.username || 'root',
    password: dbUrl.password || '',
    database: dbUrl.pathname.slice(1),
    connectionLimit: 5
});
const adapter = new PrismaMariaDb(pool);
console.log("Creating PrismaClient...");
try {
    const prisma = new PrismaClient({ adapter });
    console.log("PrismaClient created successfully");
    await prisma.$connect();
    console.log("Connected successfully");
    await prisma.$disconnect();
    await pool.end();
}
catch (err) {
    console.error("Error detected:", err);
}
//# sourceMappingURL=test-prisma-fix.js.map