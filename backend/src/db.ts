
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const setupPrisma = () => {
  console.log(`[DB] Initializing PrismaClient (Native Engine)...`);
  return new PrismaClient({
    log: ['error', 'warn'],
  });
};

export const basePrisma = globalForPrisma.prisma ?? setupPrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma;
}

export const prisma = basePrisma;

export default prisma;
