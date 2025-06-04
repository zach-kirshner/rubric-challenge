import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import databaseService from '@/lib/database-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('id')

    if (submissionId) {
      // Get specific submission details
      const submission = await databaseService.getSubmission(submissionId)
      
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
    const allSubmissions = await databaseService.getAllSubmissions()
    const summaries = allSubmissions.map(submission => {
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { submissionId, gradingResult, gradedAt } = body

    if (!submissionId || !gradingResult) {
      return NextResponse.json(
        { error: 'Submission ID and grading result are required' },
        { status: 400 }
      )
    }

    // Update the submission with grading result
    const updatedSubmission = await databaseService.updateSubmission(submissionId, {
      gradingResult,
      gradedAt: gradedAt || new Date()
    })

    logger.info({ 
      submissionId,
      rubricScore: gradingResult.score,
      promptScore: gradingResult.promptGrade?.score
    }, 'Submission grading updated via admin')

    return NextResponse.json({ 
      success: true, 
      submission: updatedSubmission 
    })
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error updating submission grading')
    return NextResponse.json(
      { error: 'Failed to update submission grading' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('id')
    const email = searchParams.get('email')

    // Single submission deletion
    if (submissionId) {
      // Check if submission exists
      const submission = await databaseService.getSubmission(submissionId)
      
      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        )
      }

      // Delete the submission (cascades to criteria and actions)
      await databaseService.deleteSubmission(submissionId)

      logger.info({ 
        submissionId,
        email: submission.email,
        fullName: submission.fullName
      }, 'Submission deleted via admin')

      return NextResponse.json({ 
        success: true,
        message: 'Submission deleted successfully'
      })
    }

    // Bulk deletion by email
    if (email) {
      const allSubmissions = await databaseService.getAllSubmissions()
      const userSubmissions = allSubmissions.filter(s => s.email.toLowerCase() === email.toLowerCase())
      
      if (userSubmissions.length === 0) {
        return NextResponse.json(
          { error: 'No submissions found for this email' },
          { status: 404 }
        )
      }

      // Delete all submissions for this email
      let deletedCount = 0
      for (const submission of userSubmissions) {
        try {
          await databaseService.deleteSubmission(submission.id)
          deletedCount++
        } catch (error) {
          logger.error({ 
            submissionId: submission.id,
            error: error instanceof Error ? error.message : String(error)
          }, 'Failed to delete submission during bulk delete')
        }
      }

      logger.info({ 
        email,
        deletedCount,
        totalSubmissions: userSubmissions.length
      }, 'Bulk deletion completed')

      return NextResponse.json({ 
        success: true,
        message: `Deleted ${deletedCount} out of ${userSubmissions.length} submissions for ${email}`,
        deletedCount
      })
    }

    return NextResponse.json(
      { error: 'Either submission ID or email is required' },
      { status: 400 }
    )
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error deleting submission')
    return NextResponse.json(
      { error: 'Failed to delete submission' },
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