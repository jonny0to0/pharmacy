const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const products = await prisma.product.count();
    console.log("Product count:", products);
    if (products > 0) {
      await prisma.product.updateMany({ data: { barcode: null } });
      console.log("Cleared barcodes (if any)");
    }
  } catch (e) {
    console.error(e);
  }
}
main().finally(() => prisma.$disconnect());
