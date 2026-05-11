import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const models = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));
  
  console.log('Database Row Counts:');
  for (const model of models) {
    try {
      const count = await (prisma as any)[model].count();
      if (count > 0) {
        console.log(`${model}: ${count}`);
      }
    } catch (e) {
      // Some properties might not be models
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
