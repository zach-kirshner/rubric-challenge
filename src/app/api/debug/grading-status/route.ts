import { NextResponse } from 'next/server'
import databaseService from '@/lib/database-service'

export async function GET() {
  try {
    // Check API key status
    const apiKey = process.env.ANTHROPIC_API_KEY
    const isValidApiKey = apiKey && 
                         apiKey.startsWith('sk-ant-') && 
                         apiKey.length > 50 &&
                         apiKey !== 'local-development-placeholder'
    
    // Get submission statistics
    const allSubmissions = await databaseService.getAllSubmissions()
    const ungradedSubmissions = allSubmissions.filter(s => !s.gradingResult)
    const gradedSubmissions = allSubmissions.filter(s => !!s.gradingResult)
    
    // Calculate grading success rate
    const recentSubmissions = allSubmissions
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10)
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      apiKeyStatus: {
        isValid: isValidApiKey,
        hasKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        startsWithSkAnt: apiKey?.startsWith('sk-ant-') || false,
        keyPrefix: apiKey ? apiKey.substring(0, 15) + '...' : 'none'
      },
      submissions: {
        total: allSubmissions.length,
        graded: gradedSubmissions.length,
        ungraded: ungradedSubmissions.length,
        gradingRate: allSubmissions.length > 0 
          ? Math.round((gradedSubmissions.length / allSubmissions.length) * 100) 
          : 0
      },
      recentSubmissions: recentSubmissions.map(s => ({
        id: s.id,
        submittedAt: s.submittedAt,
        isGraded: !!s.gradingResult,
        rubricScore: s.gradingResult?.score || null,
        promptScore: s.gradingResult?.promptGrade?.score || null
      })),
      recommendation: !isValidApiKey 
        ? 'API key is invalid or missing. Grading will use mock data.'
        : ungradedSubmissions.length > 0 
          ? `${ungradedSubmissions.length} submissions need grading. Use the "Grade Ungraded" button.`
          : 'All submissions are graded. System is working correctly.'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 