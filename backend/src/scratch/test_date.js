import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function testInvalidDate() {
    const tenantId = 'cd9393bf-92cc-487c-accf-7c43be26b9d1';
    try {
        console.log("Creating supplier with INVALID date...");
        await prisma.supplier.create({
            data: {
                name: "Test Invalid Date",
                dlExpiry: new Date("invalid-date-string"),
                tenantId
            }
        });
        console.log("Created successfully (Unexpected).");
    }
    catch (err) {
        console.log("Error Caught!");
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);
    }
    finally {
        await prisma.supplier.deleteMany({ where: { name: "Test Invalid Date" } });
        await prisma.$disconnect();
    }
}
testInvalidDate();
//# sourceMappingURL=test_date.js.map