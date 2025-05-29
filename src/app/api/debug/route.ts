import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...',
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
        databaseHost: process.env.DATABASE_URL?.match(/@([^:]+)/)?.[1] || 'not found',
        hasAdminEmails: !!process.env.ADMIN_EMAILS,
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 