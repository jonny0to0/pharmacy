import { createPool } from "mariadb";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL!;
  const dbUrl = new URL(connectionString);
  const pool = createPool({
    host: dbUrl.hostname || 'localhost',
    port: parseInt(dbUrl.port) || 3306,
    user: dbUrl.username || 'root',
    password: dbUrl.password || '',
    database: dbUrl.pathname.slice(1),
  });

  const conn = await pool.getConnection();
  const rows = await conn.query("DESCRIBE `user`;");
  console.log("User Table Columns:", JSON.stringify(rows, null, 2));
  
  const rows2 = await conn.query("DESCRIBE `tenant`;");
  console.log("Tenant Table Columns:", JSON.stringify(rows2, null, 2));

  await conn.release();
  await pool.end();
}

main().catch(console.error);
