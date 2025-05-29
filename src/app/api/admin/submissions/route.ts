import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import submissionsStore from '@/lib/submissions-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('id')

    if (submissionId) {
      // Get specific submission details
      const submission = submissionsStore.getSubmission(submissionId)
      
      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        )
      }

      // Calculate quality score based on actions (if no grading result exists)
      let qualityScore = submission.gradingResult?.score
      
      if (!qualityScore) {
        // Fallback to simple calculation if grading failed
        const totalActions = submission.criteriaActions.length
        const editActions = submission.criteriaActions.filter((a: any) => a.actionType === 'edit').length
        const deleteActions = submission.criteriaActions.filter((a: any) => a.actionType === 'delete').length
        const addActions = submission.criteriaActions.filter((a: any) => a.actionType === 'add').length
        
        // Simple scoring algorithm
        qualityScore = Math.round(
          70 + // Base score
          (editActions * 3) + // Edits show engagement
          (addActions * 5) + // Adding new criteria shows deep thinking
          (deleteActions * 2) - // Some deletions are good
          (totalActions > 20 ? (totalActions - 20) * 2 : 0) // Too many changes might indicate confusion
        )
        qualityScore = Math.min(100, Math.max(0, qualityScore))
      }

      const evaluationData = {
        submission: {
          id: submission.id,
          email: submission.email,
          fullName: submission.fullName,
          prompt: submission.prompt,
          submittedAt: submission.submittedAt,
          stats: submission.stats
        },
        criteria: {
          original: submission.criteria.filter((c: any) => c.source === 'ai_generated' && c.status !== 'deleted'),
          added: submission.criteria.filter((c: any) => c.source === 'user_added'),
          edited: submission.criteria.filter((c: any) => c.status === 'edited'),
          deleted: submission.criteria.filter((c: any) => c.status === 'deleted'),
          final: submission.criteria.filter((c: any) => c.status !== 'deleted')
        },
        actions: submission.criteriaActions,
        evaluation: {
          qualityScore,
          insights: submission.gradingResult ? submission.gradingResult.strengths : generateInsights(submission),
          gradingResult: submission.gradingResult || null,
          gradedAt: submission.gradedAt || null
        }
      }

      return NextResponse.json(evaluationData)
    }

    // Return all submissions with calculated scores
    const summaries = submissionsStore.getAllSubmissions().map(submission => {
      let rubricScore = submission.gradingResult?.score || 0
      let promptScore = submission.gradingResult?.promptGrade?.score || 0
      
      if (!submission.gradingResult?.score) {
        // Fallback to simple calculation if grading failed
        const totalActions = submission.criteriaActions.length
        const editActions = submission.criteriaActions.filter((a: any) => a.actionType === 'edit').length
        const addActions = submission.criteriaActions.filter((a: any) => a.actionType === 'add').length
        
        rubricScore = Math.round(
          70 +
          (editActions * 3) +
          (addActions * 5) +
          (submission.stats.deletedCount * 2) -
          (totalActions > 20 ? (totalActions - 20) * 2 : 0)
        )
        rubricScore = Math.min(100, Math.max(0, rubricScore))
      }
      
      // Calculate combined score
      const combinedScore = Math.round((rubricScore + promptScore) / 2)

      return {
        id: submission.id,
        email: submission.email,
        fullName: submission.fullName,
        prompt: submission.prompt.substring(0, 100) + '...',
        submittedAt: submission.submittedAt,
        stats: submission.stats,
        qualityScore: rubricScore,
        promptScore,
        combinedScore,
        grade: submission.gradingResult?.grade || null,
        promptGrade: submission.gradingResult?.promptGrade?.grade || null,
        isGraded: !!submission.gradingResult
      }
    })

    return NextResponse.json({ submissions: summaries })
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error in admin API')
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    )
  }
}

function generateInsights(submission: any): string[] {
  const insights = []
  
  if (submission.stats.addedCount > 5) {
    insights.push('Added many new criteria, showing deep understanding of the task')
  }
  
  if (submission.stats.editedCount > submission.stats.originalCount * 0.3) {
    insights.push('Significantly refined the original criteria for better clarity')
  }
  
  if (submission.stats.deletedCount > submission.stats.originalCount * 0.2) {
    insights.push('Removed many criteria, possibly focusing on quality over quantity')
  }
  
  if (submission.criteriaActions.length < 5) {
    insights.push('Made minimal changes to the original rubric')
  }
  
  const hasDetailedJustifications = submission.criteriaActions.some((a: any) => 
    a.justification && a.justification.length > 100
  )
  if (hasDetailedJustifications) {
    insights.push('Provided detailed justifications for changes')
  }
  
  return insights
} 