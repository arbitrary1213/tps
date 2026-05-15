import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrisma(): PrismaClient {
  const client = new PrismaClient()
  const originalDisconnect = client.$disconnect.bind(client)
  client.$disconnect = async () => {
    globalForPrisma.prisma = undefined
    return originalDisconnect()
  }
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

process.on('beforeExit', async () => {
  await prisma.$disconnect()
})