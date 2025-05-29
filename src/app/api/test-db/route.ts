import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function GET() {
  try {
    // Test database connection and table structure
    const userCount = await prisma.user.count()
    const submissionCount = await prisma.submission.count()
    const criterionCount = await prisma.criterion.count()
    const actionCount = await prisma.criterionAction.count()
    
    // Get some sample data to verify what's actually in the database
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' }
    })
    
    const sampleSubmissions = await prisma.submission.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true
      }
    })
    
    // Get database connection info
    const dbUrl = process.env.DATABASE_URL
    const dbHost = dbUrl?.match(/@([^:]+)/)?.[1] || 'unknown'
    const dbName = dbUrl?.split('/').pop()?.split('?')[0] || 'unknown'
    
    logger.info({ 
      userCount, 
      submissionCount, 
      criterionCount, 
      actionCount,
      dbHost,
      dbName 
    }, 'Database test with detailed info')
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection and schema working correctly',
      connectionInfo: {
        host: dbHost,
        database: dbName,
        url: dbUrl?.substring(0, 50) + '...'
      },
      counts: {
        users: userCount,
        submissions: submissionCount,
        criteria: criterionCount,
        actions: actionCount
      },
      sampleData: {
        users: sampleUsers.map(u => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          createdAt: u.createdAt
        })),
        submissions: sampleSubmissions.map(s => ({
          id: s.id,
          email: s.user.email,
          fullName: s.user.fullName,
          prompt: s.prompt.substring(0, 100) + '...',
          createdAt: s.createdAt
        }))
      }
    })
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Database test failed')
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Database test failed',
      connectionInfo: {
        url: process.env.DATABASE_URL?.substring(0, 50) + '...'
      }
    }, { status: 500 })
  }
} 