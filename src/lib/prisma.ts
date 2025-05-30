import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prepare database URL with connection pooling for production
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) return baseUrl
  
  // Add connection pooling parameters for production
  if (process.env.NODE_ENV === 'production') {
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}connection_limit=1&pool_timeout=20`
  }
  
  return baseUrl
}

// Create a singleton Prisma client with proper configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  }
})

// Ensure we only create one instance in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
}) 