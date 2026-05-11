import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testDuplicate() {
  const tenantId = 'cd9393bf-92cc-487c-accf-7c43be26b9d1';
  try {
    console.log("Creating first supplier with empty mobile...");
    await prisma.supplier.create({
      data: {
        name: "Test 1",
        mobile: "",
        tenantId
      }
    });
    console.log("First created successfully.");
    
    console.log("Creating second supplier with empty mobile...");
    await prisma.supplier.create({
      data: {
        name: "Test 2",
        mobile: "",
        tenantId
      }
    });
    console.log("Second created successfully.");
  } catch (err: any) {
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
  } finally {
    // Cleanup
    await prisma.supplier.deleteMany({ where: { tenantId } });
    await prisma.$disconnect();
  }
}

testDuplicate();
