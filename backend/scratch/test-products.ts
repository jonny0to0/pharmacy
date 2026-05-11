import prisma from "../src/db.js";

async function main() {
  try {
    const products = await prisma.product.findMany({
      take: 5,
      include: {
        stockbatch: {
          where: {
            quantity: { gt: 0 }
          },
          orderBy: {
            expiryDate: 'asc'
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log("Success:", products.length);
  } catch (err) {
    console.error("Prisma Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
