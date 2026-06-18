import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = "ef21411e-0424-4b56-a5cc-769f00cfc531";
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  console.log("=== USER Nasiruddin ===");
  console.dir(user, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
