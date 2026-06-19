import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();
const prisma = new PrismaClient();
async function cleanDatabase() {
    console.log("Starting database cleanup...");
    try {
        // 1. Disable foreign key checks
        await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");
        // 2. Get all tables in the current database
        // We filter out the migration table to preserve the schema history
        const tables = await prisma.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'medisynex' AND table_name != '_prisma_migrations'`);
        console.log(`Found ${tables.length} tables to clean.`);
        console.log('Sample table object:', tables[0]);
        // 3. Truncate each table
        for (const table of tables) {
            // Accessing with both possible cases
            const tableName = table.table_name || table.TABLE_NAME;
            if (!tableName) {
                console.warn('Could not determine table name from:', table);
                continue;
            }
            console.log(`Cleaning table: ${tableName}`);
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${tableName}\`;`);
        }
        // 4. Re-enable foreign key checks
        await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
        console.log("Database cleanup completed successfully.");
    }
    catch (error) {
        console.error("Error during database cleanup:", error);
        // Ensure we re-enable foreign keys even if error occurs
        await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
cleanDatabase().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=clean-db.js.map