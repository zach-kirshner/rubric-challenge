import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const debug: {
    hasDatabase: boolean
    databaseUrlSet: string
    anthropicKeySet: string
    nodeEnv: string | undefined
    timestamp: string
    databaseConnection?: string
    databaseError?: string
  } = {
    hasDatabase: !!process.env.DATABASE_URL,
    databaseUrlSet: process.env.DATABASE_URL ? 'Yes' : 'No',
    anthropicKeySet: process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }

  // Try to connect to database
  try {
    await prisma.$connect()
    debug.databaseConnection = 'Success'
    await prisma.$disconnect()
  } catch (error) {
    debug.databaseConnection = 'Failed'
    debug.databaseError = error instanceof Error ? error.message : 'Unknown error'
  }

  return NextResponse.json(debug)
} 