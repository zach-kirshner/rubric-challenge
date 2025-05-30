import { NextRequest, NextResponse } from 'next/server'
import databaseService from '@/lib/database-service'

export async function GET(request: NextRequest) {
  try {
    // Get a sample submission to test background grading
    const allSubmissions = await databaseService.getAllSubmissions()
    
    if (allSubmissions.length === 0) {
      return NextResponse.json({ 
        message: 'No submissions found to test',
        test: 'background-grading'
      })
    }

    const latestSubmission = allSubmissions[allSubmissions.length - 1]
    
    return NextResponse.json({
      test: 'background-grading',
      submissionId: latestSubmission.id,
      isGraded: !!latestSubmission.gradingResult,
      submittedAt: latestSubmission.submittedAt,
      gradedAt: latestSubmission.gradedAt,
      timeSinceSubmission: new Date().getTime() - new Date(latestSubmission.submittedAt).getTime(),
      status: latestSubmission.gradingResult ? 'completed' : 'pending'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 