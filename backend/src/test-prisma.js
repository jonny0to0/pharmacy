import prisma from "./db.js";
async function main() {
    try {
        console.log("Checking database connection...");
        const userCount = await prisma.user.count();
        console.log(`Connected successfully! Users in DB: ${userCount}`);
    }
    catch (err) {
        console.error("Connection failed:", err);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-prisma.js.map