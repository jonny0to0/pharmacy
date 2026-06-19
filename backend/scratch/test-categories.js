import prisma from "../src/db.js";
async function main() {
    try {
        const categories = await prisma.category.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                displayOrder: "asc",
            },
        });
        console.log("Success Categories:", categories.length);
    }
    catch (err) {
        console.error("Prisma Error Categories:", err);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-categories.js.map