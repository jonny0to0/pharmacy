import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Category seeding...");

  // 1. Ensure we have at least one tenant to link categories to
  let tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
    console.log("No tenant found. Creating a default tenant...");
    tenant = await prisma.tenant.create({
      data: {
        businessName: "Medisynex Pharmacy",
        businessType: "PHARMACY",
        isSetupCompleted: true,
      }
    });
  }

  const tenantId = tenant.id;

  const defaultCategories = [
    { name: "Medicines", displayOrder: 1, iconName: "pill" },
    { name: "FMCG", displayOrder: 2, iconName: "shopping-cart" },
    { name: "General", displayOrder: 3, iconName: "package" },
    { name: "Uncategorized", displayOrder: 99, iconName: "box" },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: {
        name_tenantId: {
          name: cat.name,
          tenantId: tenantId,
        },
      },
      update: {
        displayOrder: cat.displayOrder,
        iconName: cat.iconName,
      },
      create: {
        name: cat.name,
        displayOrder: cat.displayOrder,
        iconName: cat.iconName,
        tenantId: tenantId,
      },
    });
    console.log(`Seeded category: ${cat.name}`);
  }

  console.log("Category seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
