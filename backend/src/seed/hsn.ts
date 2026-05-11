import "dotenv/config";
import prisma from "../db.js";

const hsnData = [
  { hsnCode: "3004", gstRate: 12, description: "Medicaments (excluding goods of heading 30.02, 30.05 or 30.06) consisting of mixed or unmixed products for therapeutic or prophylactic uses" },
  { hsnCode: "3004", gstRate: 5, description: "Medicaments (excluding goods of heading 30.02, 30.05 or 30.06) consisting of mixed or unmixed products for therapeutic or prophylactic uses (specific concessional drugs)" },
  { hsnCode: "3002", gstRate: 5, description: "Human blood; animal blood prepared for therapeutic, prophylactic or diagnostic uses; antisera, other blood fractions and immunological products" },
  { hsnCode: "3006", gstRate: 12, description: "Pharmaceutical goods specified in Note 4 to this Chapter" },
  { hsnCode: "3307", gstRate: 18, description: "Pre-shave, shaving or after-shave preparations, personal deodorants, bath preparations, depilatories and other perfumery, cosmetic or toilet preparations" },
  { hsnCode: "9018", gstRate: 12, description: "Instruments and appliances used in medical, surgical, dental or veterinary sciences" },
  { hsnCode: "9021", gstRate: 5, description: "Orthopaedic appliances, including crutches, surgical belts and trusses; splints and other fracture appliances" },
  { hsnCode: "2106", gstRate: 18, description: "Food preparations not elsewhere specified or included (Health supplements)" }
];

async function main() {
  console.log("Seeding HSN Master data...");
  let count = 0;
  for (const item of hsnData) {
    try {
      await prisma.hsnMaster.upsert({
        where: {
          hsnCode_gstRate: {
            hsnCode: item.hsnCode,
            gstRate: item.gstRate
          }
        },
        update: {},
        create: item
      });
      count++;
    } catch (error) {
      console.error(`Failed to seed HSN ${item.hsnCode}:`, error);
    }
  }
  console.log(`Successfully seeded ${count} HSN records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
