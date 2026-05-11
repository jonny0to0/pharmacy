import prisma from "../src/db.js";
import { randomUUID } from "crypto";

async function main() {
  try {
    // get a user and tenant
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found.");
      return;
    }
    const tenantId = user.tenantId;

    let product = await prisma.product.findFirst({ where: { tenantId } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          id: randomUUID(),
          name: "Test Product",
          sku: "TEST-001",
          tenantId,
          updatedAt: new Date()
        }
      });
    }

    const invoiceNumber = `TEST-${Date.now()}`;
    const invoice = await prisma.saleinvoice.create({
      data: {
        id: randomUUID(),
        invoiceNumber,
        tenantId,
        type: "TAX_INVOICE",
        subTotal: 100,
        totalTax: 10,
        grandTotal: 110,
        amountPaid: 110,
        isCash: true,
        status: "PAID",
        updatedAt: new Date(),
        saleinvoiceitem: {
          create: [
            {
              id: randomUUID(),
              productId: product.id,
              tenantId,
              quantity: 1,
              rate: 100,
              gstRate: 10,
              taxableAmount: 100,
              cgstAmount: 5,
              sgstAmount: 5,
              total: 110,
              updatedAt: new Date(),
            }
          ]
        }
      }
    });

    console.log("Success! Created Invoice ID:", invoice.id);
  } catch (err) {
    console.error("Prisma Error Sales:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
