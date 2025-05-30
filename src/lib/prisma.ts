import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prepare database URL with optimized connection pooling for Supabase + Vercel
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) return baseUrl
  
  // For production (Vercel), ensure we use pgbouncer with strict connection limits
  if (process.env.NODE_ENV === 'production') {
    // Check if already has pgbouncer parameters
    if (baseUrl.includes('pgbouncer=true')) {
      return baseUrl
    }
    
    // Add pgbouncer and connection limit parameters
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}pgbouncer=true&connection_limit=1&pool_timeout=20`
  }
  
  return baseUrl
}

// Create a singleton Prisma client with proper configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
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

// Disconnect on process exit to prevent connection leaks
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting Prisma:', error)
    }
  })
  
  process.on('SIGINT', async () => {
    try {
      await prisma.$disconnect()
      process.exit(0)
    } catch (error) {
      console.error('Error disconnecting Prisma on SIGINT:', error)
      process.exit(1)
    }
  })
  
  process.on('SIGTERM', async () => {
    try {
      await prisma.$disconnect()
      process.exit(0)
    } catch (error) {
      console.error('Error disconnecting Prisma on SIGTERM:', error)
      process.exit(1)
    }
  })
} 