import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import databaseService from '@/lib/database-service'

export async function GET(request: NextRequest) {
  try {
    // Get all submissions with user data for analytics
    const allSubmissions = await databaseService.getDashboardSubmissions()
    
    // Calculate overview statistics
    const totalUsers = new Set(allSubmissions.map(s => s.userId)).size
    const totalSubmissions = allSubmissions.length
    const averageRubricScore = allSubmissions.reduce((sum, s) => sum + (s.gradingResult?.score || 0), 0) / totalSubmissions || 0
    const averagePromptScore = allSubmissions.reduce((sum, s) => sum + (s.gradingResult?.promptGrade?.score || 0), 0) / totalSubmissions || 0
    const averageCombinedScore = (averageRubricScore + averagePromptScore) / 2
    
    // Score distribution (0-100 in buckets of 10)
    const rubricScoreDistribution = Array(10).fill(0)
    const promptScoreDistribution = Array(10).fill(0)
    const combinedScoreDistribution = Array(10).fill(0)
    
    // User performance data
    const userPerformance = new Map()
    
    allSubmissions.forEach(submission => {
      const rubricScore = submission.gradingResult?.score || 0
      const promptScore = submission.gradingResult?.promptGrade?.score || 0
      const combinedScore = Math.round((rubricScore + promptScore) / 2)
      
      // Update score distributions
      const rubricBucket = Math.min(9, Math.floor(rubricScore / 10))
      const promptBucket = Math.min(9, Math.floor(promptScore / 10))
      const combinedBucket = Math.min(9, Math.floor(combinedScore / 10))
      
      rubricScoreDistribution[rubricBucket]++
      promptScoreDistribution[promptBucket]++
      combinedScoreDistribution[combinedBucket]++
      
      // Update user performance
      if (!userPerformance.has(submission.userId)) {
        userPerformance.set(submission.userId, {
          userId: submission.userId,
          email: submission.email,
          fullName: submission.fullName,
          submissions: [],
          totalSubmissions: 0,
          averageRubricScore: 0,
          averagePromptScore: 0,
          averageCombinedScore: 0,
          totalActionsCount: 0,
          firstSubmissionAt: submission.submittedAt,
          lastSubmissionAt: submission.submittedAt
        })
      }
      
      const user = userPerformance.get(submission.userId)
      user.submissions.push({
        id: submission.id,
        prompt: submission.prompt,
        rubricScore,
        promptScore,
        combinedScore,
        submittedAt: submission.submittedAt,
        stats: submission.stats
      })
      user.totalSubmissions++
      user.totalActionsCount += submission.totalActions || 0
      
      if (new Date(submission.submittedAt) < new Date(user.firstSubmissionAt)) {
        user.firstSubmissionAt = submission.submittedAt
      }
      if (new Date(submission.submittedAt) > new Date(user.lastSubmissionAt)) {
        user.lastSubmissionAt = submission.submittedAt
      }
    })
    
    // Calculate user averages
    userPerformance.forEach(user => {
      const scores = user.submissions
      user.averageRubricScore = Math.round(scores.reduce((sum: number, s: any) => sum + s.rubricScore, 0) / scores.length || 0)
      user.averagePromptScore = Math.round(scores.reduce((sum: number, s: any) => sum + s.promptScore, 0) / scores.length || 0)
      user.averageCombinedScore = Math.round(scores.reduce((sum: number, s: any) => sum + s.combinedScore, 0) / scores.length || 0)
    })
    
    // Convert Map to Array and sort by performance
    const userPerformanceArray = Array.from(userPerformance.values())
      .sort((a, b) => b.averageCombinedScore - a.averageCombinedScore)
    
    // Submission timeline (by day)
    const submissionTimeline = new Map()
    allSubmissions.forEach(submission => {
      const date = new Date(submission.submittedAt).toISOString().split('T')[0]
      if (!submissionTimeline.has(date)) {
        submissionTimeline.set(date, 0)
      }
      submissionTimeline.set(date, submissionTimeline.get(date) + 1)
    })
    
    const timelineData = Array.from(submissionTimeline.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))
    
    // Top performers (top 10% by combined score)
    const topPerformersCount = Math.max(1, Math.ceil(userPerformanceArray.length * 0.1))
    const topPerformers = userPerformanceArray.slice(0, topPerformersCount)
    
    // Grade distribution
    const gradeDistribution: {
      rubric: { [key: string]: number }
      prompt: { [key: string]: number }
      combined: { [key: string]: number }
    } = {
      rubric: {},
      prompt: {},
      combined: {}
    }
    
    allSubmissions.forEach(submission => {
      const rubricGrade = submission.gradingResult?.grade || 'Not Graded'
      const promptGrade = submission.gradingResult?.promptGrade?.grade || 'Not Graded'
      
      const rubricScore = submission.gradingResult?.score || 0
      const promptScore = submission.gradingResult?.promptGrade?.score || 0
      const combinedScore = Math.round((rubricScore + promptScore) / 2)
      
      let combinedGrade = 'Not Graded'
      if (combinedScore >= 90) combinedGrade = 'EXCELLENT'
      else if (combinedScore >= 80) combinedGrade = 'VERY GOOD'
      else if (combinedScore >= 70) combinedGrade = 'GOOD'
      else if (combinedScore >= 60) combinedGrade = 'SATISFACTORY'
      else if (combinedScore >= 50) combinedGrade = 'NEEDS IMPROVEMENT'
      else combinedGrade = 'UNSATISFACTORY'
      
      gradeDistribution.rubric[rubricGrade] = (gradeDistribution.rubric[rubricGrade] || 0) + 1
      gradeDistribution.prompt[promptGrade] = (gradeDistribution.prompt[promptGrade] || 0) + 1
      gradeDistribution.combined[combinedGrade] = (gradeDistribution.combined[combinedGrade] || 0) + 1
    })
    
    return NextResponse.json({
      overview: {
        totalUsers,
        totalSubmissions,
        averageRubricScore: Math.round(averageRubricScore),
        averagePromptScore: Math.round(averagePromptScore),
        averageCombinedScore: Math.round(averageCombinedScore),
        submissionsPerUser: Math.round(totalSubmissions / totalUsers * 10) / 10
      },
      scoreDistribution: {
        rubric: rubricScoreDistribution,
        prompt: promptScoreDistribution,
        combined: combinedScoreDistribution
      },
      gradeDistribution,
      userPerformance: userPerformanceArray,
      topPerformers,
      submissionTimeline: timelineData
    })
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error in dashboard API')
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
} 