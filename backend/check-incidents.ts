import prisma from "./src/db.js";

async function main() {
  const incidents = await prisma.incident.findMany({
    take: 5,
    orderBy: { createdAt: "desc" }
  });
  console.log(JSON.stringify(incidents, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
