import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  try {
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        mobile: true,
        tenantId: true
      }
    });
    console.log("Current Suppliers:");
    console.table(suppliers);
    
    const empties = suppliers.filter(s => s.mobile === "");
    console.log(`Suppliers with empty string mobile: ${empties.length}`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
