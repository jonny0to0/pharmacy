import { createConnection } from 'mariadb';
import dotenv from 'dotenv';
dotenv.config();
async function test() {
    let conn;
    try {
        const url = new URL(process.env.DATABASE_URL);
        console.log(`Connecting to ${url.hostname}:${url.port}...`);
        conn = await createConnection({
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            user: url.username || 'root',
            password: url.password || '',
            database: url.pathname.slice(1)
        });
        console.log("Connected successfully!");
        const rows = await conn.query("SELECT 1 as val");
        console.log("Query result:", rows);
    }
    catch (err) {
        console.error("Connection error:", err);
    }
    finally {
        if (conn)
            await conn.end();
    }
}
test();
//# sourceMappingURL=test-direct-db.js.map