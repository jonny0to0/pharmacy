import "dotenv/config";
import { PrismaClient } from "@prisma/client";

try {
  console.log("Initializing Prisma...");
  const prisma = new PrismaClient();
  console.log("Prisma instantiated!");
  await prisma.$connect();
  console.log("Prisma connected!");
  process.exit(0);
} catch (error) {
  console.error("PRISMA ERROR DETAILS:");
  console.error(error.message);
  process.exit(1);
}
