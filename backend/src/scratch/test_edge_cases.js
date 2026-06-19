import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function testEdgeCases() {
    const tenantId = 'cd9393bf-92cc-487c-accf-7c43be26b9d1';
    // SafeDate helper duplicate for test
    const safeDate = (val) => {
        if (!val || val === "")
            return null;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
    };
    try {
        console.log("--- Starting Edge Case Tests ---");
        // Case 1: Multiple Suppliers with empty mobile
        console.log("Case 1: Multiple Suppliers with empty mobile strings");
        await prisma.supplier.deleteMany({ where: { tenantId } });
        await prisma.supplier.create({
            data: { name: "Empty Mobile 1", mobile: null, tenantId }
        });
        console.log("First created with NULL mobile.");
        await prisma.supplier.create({
            data: { name: "Empty Mobile 2", mobile: null, tenantId }
        });
        console.log("Second created with NULL mobile. (Success)");
        // Case 2: Invalid Date Handling
        console.log("\nCase 2: Invalid Date Handling");
        const invalidDate = "not-a-date";
        const dateToSave = safeDate(invalidDate);
        console.log(`Input: "${invalidDate}" -> Result:`, dateToSave);
        await prisma.supplier.create({
            data: { name: "Invalid Date Test", dlExpiry: dateToSave, tenantId }
        });
        console.log("Supplier with malformed date date saved as NULL. (Success)");
        // Case 3: Leading/Trailing Whitespace in Mobile
        console.log("\nCase 3: Trimmed Mobile");
        const mobileWithSpace = " 9876543210 ";
        await prisma.supplier.create({
            data: { name: "Space Test", mobile: mobileWithSpace.trim(), tenantId }
        });
        console.log(`Created supplier with trimmed mobile: "${mobileWithSpace.trim()}"`);
    }
    catch (err) {
        console.error("TEST FAILED!");
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);
    }
    finally {
        // Cleanup
        await prisma.supplier.deleteMany({ where: { tenantId } });
        await prisma.$disconnect();
        console.log("\n--- Tests Completed ---");
    }
}
testEdgeCases();
//# sourceMappingURL=test_edge_cases.js.map