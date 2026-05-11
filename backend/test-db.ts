import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })

async function main() {
  console.log('Connecting to db...')
  try {
     const count = await prisma.user.count()
     console.log('User count:', count)
  } catch (e) {
     console.error('Crash!', e)
  }
}
main().finally(() => process.exit(0))
