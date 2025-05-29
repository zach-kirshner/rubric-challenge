import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import databaseService from '@/lib/database-service'

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function generateUserCSV(submissions: any[]): string {
  // Group submissions by user
  const userMap = new Map()
  
  submissions.forEach(submission => {
    if (!userMap.has(submission.userId)) {
      userMap.set(submission.userId, {
        userId: submission.userId,
        email: submission.email,
        fullName: submission.fullName,
        submissions: [],
        totalSubmissions: 0,
        totalActionsCount: 0,
        firstSubmissionAt: submission.submittedAt,
        lastSubmissionAt: submission.submittedAt
      })
    }
    
    const user = userMap.get(submission.userId)
    const rubricScore = submission.gradingResult?.score || 0
    const promptScore = submission.gradingResult?.promptGrade?.score || 0
    const combinedScore = Math.round((rubricScore + promptScore) / 2)
    
    user.submissions.push({
      rubricScore,
      promptScore,
      combinedScore,
      submittedAt: submission.submittedAt,
      actionsCount: submission.criteriaActions.length
    })
    user.totalSubmissions++
    user.totalActionsCount += submission.criteriaActions.length
    
    if (new Date(submission.submittedAt) < new Date(user.firstSubmissionAt)) {
      user.firstSubmissionAt = submission.submittedAt
    }
    if (new Date(submission.submittedAt) > new Date(user.lastSubmissionAt)) {
      user.lastSubmissionAt = submission.submittedAt
    }
  })
  
  // Calculate user averages
  userMap.forEach(user => {
    const scores = user.submissions
    user.averageRubricScore = Math.round(scores.reduce((sum: number, s: any) => sum + s.rubricScore, 0) / scores.length || 0)
    user.averagePromptScore = Math.round(scores.reduce((sum: number, s: any) => sum + s.promptScore, 0) / scores.length || 0)
    user.averageCombinedScore = Math.round(scores.reduce((sum: number, s: any) => sum + s.combinedScore, 0) / scores.length || 0)
    user.bestScore = Math.max(...scores.map((s: any) => s.combinedScore))
    user.averageActionsPerSubmission = Math.round(user.totalActionsCount / user.totalSubmissions * 10) / 10
  })
  
  const users = Array.from(userMap.values())
  
  // CSV headers
  const headers = [
    'User ID',
    'Email', 
    'Full Name',
    'Total Submissions',
    'Average Rubric Score',
    'Average Prompt Score', 
    'Average Combined Score',
    'Best Score',
    'Total Actions',
    'Average Actions Per Submission',
    'First Submission',
    'Last Submission',
    'Days Active'
  ]
  
  // CSV rows
  const rows = users.map(user => {
    const firstDate = new Date(user.firstSubmissionAt)
    const lastDate = new Date(user.lastSubmissionAt)
    const daysActive = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return [
      escapeCSV(user.userId),
      escapeCSV(user.email),
      escapeCSV(user.fullName),
      escapeCSV(user.totalSubmissions),
      escapeCSV(user.averageRubricScore),
      escapeCSV(user.averagePromptScore),
      escapeCSV(user.averageCombinedScore),
      escapeCSV(user.bestScore),
      escapeCSV(user.totalActionsCount),
      escapeCSV(user.averageActionsPerSubmission),
      escapeCSV(firstDate.toISOString().split('T')[0]),
      escapeCSV(lastDate.toISOString().split('T')[0]),
      escapeCSV(daysActive)
    ]
  })
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

function generateSubmissionCSV(submissions: any[]): string {
  // CSV headers
  const headers = [
    'Submission ID',
    'User ID',
    'Email',
    'Full Name',
    'Prompt',
    'Submitted At',
    'Rubric Score',
    'Prompt Score',
    'Combined Score',
    'Rubric Grade',
    'Prompt Grade',
    'Original Criteria Count',
    'Final Criteria Count',
    'Added Count',
    'Edited Count',
    'Deleted Count',
    'Total Actions',
    'Status',
    'Is Graded'
  ]
  
  // CSV rows
  const rows = submissions.map(submission => {
    const rubricScore = submission.gradingResult?.score || 0
    const promptScore = submission.gradingResult?.promptGrade?.score || 0
    const combinedScore = Math.round((rubricScore + promptScore) / 2)
    
    return [
      escapeCSV(submission.id),
      escapeCSV(submission.userId),
      escapeCSV(submission.email),
      escapeCSV(submission.fullName),
      escapeCSV(submission.prompt),
      escapeCSV(new Date(submission.submittedAt).toISOString()),
      escapeCSV(rubricScore),
      escapeCSV(promptScore),
      escapeCSV(combinedScore),
      escapeCSV(submission.gradingResult?.grade || 'Not Graded'),
      escapeCSV(submission.gradingResult?.promptGrade?.grade || 'Not Graded'),
      escapeCSV(submission.stats.originalCount),
      escapeCSV(submission.stats.finalCount),
      escapeCSV(submission.stats.addedCount),
      escapeCSV(submission.stats.editedCount),
      escapeCSV(submission.stats.deletedCount),
      escapeCSV(submission.criteriaActions.length),
      escapeCSV(submission.status),
      escapeCSV(submission.gradingResult ? 'Yes' : 'No')
    ]
  })
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'users' // 'users' or 'submissions'
    
    // Get all submissions with user data
    const allSubmissions = await databaseService.getAllSubmissions()
    
    let csvContent: string
    let filename: string
    
    if (type === 'submissions') {
      csvContent = generateSubmissionCSV(allSubmissions)
      filename = `submissions_export_${new Date().toISOString().split('T')[0]}.csv`
    } else {
      csvContent = generateUserCSV(allSubmissions)
      filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`
    }
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error in export API')
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    )
  }
} 