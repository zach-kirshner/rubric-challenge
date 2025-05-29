import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function GET() {
  try {
    // Test database connection and table structure
    const userCount = await prisma.user.count()
    const submissionCount = await prisma.submission.count()
    
    // Test creating a sample user (we'll delete it right after)
    const testEmail = `test-${Date.now()}@example.com`
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        fullName: 'Test User'
      }
    })
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    
    logger.info({ userCount, submissionCount }, 'Database test successful')
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection and schema working correctly',
      counts: {
        users: userCount,
        submissions: submissionCount
      },
      testResult: 'Test user created and deleted successfully'
    })
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Database test failed')
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Database test failed'
    }, { status: 500 })
  }
} 