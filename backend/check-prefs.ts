import prisma from "./src/db.js";

async function main() {
  const prefs = await prisma.notificationpreference.findMany({
    take: 5
  });
  console.log(JSON.stringify(prefs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
