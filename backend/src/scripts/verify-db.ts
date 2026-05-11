import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function verify() {
  console.log("Verifying database state...");
  
  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const invoiceCount = await prisma.saleInvoice.count();
  const hsnCount = await prisma.hsnMaster.count();
  const roleCount = await prisma.role.count();
  const tenantCount = await prisma.tenant.count();

  console.log({
    users: userCount,
    products: productCount,
    invoices: invoiceCount,
    hsnCodes: hsnCount,
    roles: roleCount,
    tenants: tenantCount,
  });

  if (userCount === 1 && productCount === 0 && invoiceCount === 0 && hsnCount > 0) {
    console.log("Verification SUCCESS: Database is clean and essential data is re-seeded.");
  } else {
    console.warn("Verification WARNING: Database state is not exactly as expected.");
  }

  await prisma.$disconnect();
}

verify().catch(console.error);
