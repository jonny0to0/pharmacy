
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { createPool } from "mariadb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const dbUrl = new URL(connectionString);
const dbUser = dbUrl.username || 'root';
const dbPassword = dbUrl.password || '';
const dbHost = dbUrl.hostname || 'localhost';
const dbPort = parseInt(dbUrl.port) || 3306;
const dbName = dbUrl.pathname.slice(1);

const pool = createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  connectionLimit: 1,
});

const adapter = new PrismaMariaDb(pool);

console.log("Creating PrismaClient...");
try {
  const prisma = new PrismaClient({
    adapter,
  });
  console.log("PrismaClient created successfully");
  await prisma.$connect();
  console.log("Connected successfully");
  await prisma.$disconnect();
} catch (error) {
  console.error("Error:", error);
} finally {
  await pool.end();
}
