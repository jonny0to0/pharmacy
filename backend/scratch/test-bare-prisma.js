import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();
async function test() {
    console.log("Creating PrismaClient...");
    const prisma = new PrismaClient();
    console.log("PrismaClient created.");
    try {
        console.log("Connecting...");
        await prisma.$connect();
        console.log("Connected!");
        console.log("Querying...");
        const modules = await prisma.module.findMany();
        console.log("Modules found:", modules.length);
    }
    catch (err) {
        console.error("Error:", err);
    }
    finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}
test();
//# sourceMappingURL=test-bare-prisma.js.map