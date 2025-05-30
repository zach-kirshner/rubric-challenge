import { NextResponse } from 'next/server'
import logger from '@/lib/logger'

export async function GET() {
  logger.info('Test improvements API called')
  
  return NextResponse.json({
    test: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    envCheck: {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  })
} 