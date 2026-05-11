import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testFix() {
  const tenantId = 'cd9393bf-92cc-487c-accf-7c43be26b9d1';
  try {
    console.log("Cleaning up before test...");
    await prisma.supplier.deleteMany({ where: { tenantId } });

    console.log("Creating first supplier with NULL mobile...");
    await prisma.supplier.create({
      data: {
        name: "Test Normal 1",
        mobile: null,
        tenantId
      }
    });
    console.log("First created successfully.");
    
    console.log("Creating second supplier with NULL mobile...");
    await prisma.supplier.create({
      data: {
        name: "Test Normal 2",
        mobile: null,
        tenantId
      }
    });
    console.log("Second created successfully. (Fix Confirmed)");
    
  } catch (err: any) {
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
  } finally {
    // Cleanup
    await prisma.supplier.deleteMany({ where: { tenantId } });
    await prisma.$disconnect();
  }
}

testFix();
