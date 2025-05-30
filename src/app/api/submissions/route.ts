import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { RubricItem, Action, Criterion, CriterionAction } from '@/types'
import databaseService from '@/lib/database-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName, prompt, originalRubricItems, finalRubricItems, actions } = body

    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    logger.info({ 
      email, 
      fullName,
      originalCount: originalRubricItems.length,
      finalCount: finalRubricItems.length,
      actionsCount: actions.length 
    }, 'Processing submission')

    // Create submission data structure
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create criteria records
    const criteria: Criterion[] = []
    const criteriaActions: CriterionAction[] = []
    
    // Process original items
    const originalItemsMap = new Map(originalRubricItems.map((item: RubricItem) => [item.id, item]))
    const finalItemsMap = new Map(finalRubricItems.map((item: RubricItem) => [item.id, item]))
    
    // Track all original criteria
    originalRubricItems.forEach((item: RubricItem, index: number) => {
      const criterion: Criterion = {
        id: `crit_${Date.now()}_${index}`,
        submissionId,
        originalId: item.id,
        text: item.criterion,
        isPositive: item.isPositive !== false,
        source: 'ai_generated',
        status: 'active',
        order: index,
        createdAt: new Date()
      }
      
      // Check if item was edited or deleted
      const finalItem = finalItemsMap.get(item.id)
      if (!finalItem) {
        // Item was deleted
        criterion.status = 'deleted'
      } else {
        const typedFinalItem = finalItem as RubricItem
        if (typedFinalItem.criterion !== item.criterion) {
          // Item was edited
          criterion.status = 'edited'
          criterion.finalText = typedFinalItem.criterion
        }
      }
      
      criteria.push(criterion)
    })
    
    // Track user-added criteria
    finalRubricItems.forEach((item: RubricItem, index: number) => {
      if (!originalItemsMap.has(item.id)) {
        // This is a new item added by the user
        const criterion: Criterion = {
          id: `crit_${Date.now()}_${criteria.length}`,
          submissionId,
          originalId: item.id,
          text: item.criterion,
          isPositive: item.isPositive !== false,
          source: 'user_added',
          status: 'active',
          order: index,
          createdAt: new Date()
        }
        criteria.push(criterion)
      }
    })
    
    // Process actions into CriterionAction records
    actions.forEach((action: Action, index: number) => {
      // Map the frontend itemId to the actual database criterion ID
      let actualCriterionId: string | undefined = undefined
      if (action.itemId) {
        // Find the criterion with matching originalId
        const matchingCriterion = criteria.find(c => c.originalId === action.itemId)
        actualCriterionId = matchingCriterion?.id
      }

      const criterionAction: CriterionAction = {
        id: `action_${Date.now()}_${index}`,
        submissionId,
        criterionId: actualCriterionId,
        actionType: action.type,
        previousText: action.originalText,
        newText: action.newText,
        previousOrder: action.previousOrder,
        newOrder: action.newOrder,
        justification: action.justification,
        timestamp: new Date(action.timestamp),
        createdAt: new Date()
      }
      criteriaActions.push(criterionAction)
    })
    
    // Create the submission record
    const submission: any = {
      id: submissionId,
      email: email.toLowerCase(),
      fullName,
      prompt,
      status: 'submitted',
      submittedAt: new Date(),
      createdAt: new Date(),
      criteria,
      criteriaActions,
      stats: {
        originalCount: originalRubricItems.length,
        finalCount: finalRubricItems.length,
        deletedCount: criteria.filter(c => c.status === 'deleted').length,
        editedCount: criteria.filter(c => c.status === 'edited').length,
        addedCount: criteria.filter(c => c.source === 'user_added').length,
      },
      gradingResult: null,
      gradedAt: null
    }
    
    // Store submission using persistent storage
    await databaseService.addSubmission(submission)
    
    logger.info({ 
      submissionId,
      email: email.toLowerCase(),
      fullName,
      criteriaCount: criteria.length,
      actionsCount: criteriaActions.length,
      deletedCount: criteria.filter(c => c.status === 'deleted').length,
      editedCount: criteria.filter(c => c.status === 'edited').length,
      addedCount: criteria.filter(c => c.source === 'user_added').length
    }, 'Submission created successfully')

    // Return success response immediately
    const response = NextResponse.json({ 
      success: true, 
      submissionId,
      message: 'Submission received successfully'
    })

    // Trigger background grading (fire and forget)
    logger.info({ submissionId }, 'Triggering background grading')
    
    // Create the base URL for internal API calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    
    // Fire and forget - don't await this
    fetch(`${baseUrl}/api/admin/grade-submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId })
    }).catch(error => {
      logger.error(error instanceof Error ? error.message : String(error), 'Background grading failed')
    })

    return response

  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error processing submission')
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all submissions from persistent storage
    const allSubmissions = await databaseService.getAllSubmissions()
    
    return NextResponse.json({
      submissions: allSubmissions.map(sub => ({
        id: sub.id,
        email: sub.email,
        fullName: sub.fullName,
        prompt: sub.prompt.substring(0, 100) + '...',
        submittedAt: sub.submittedAt,
        stats: sub.stats
      }))
    })
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error fetching submissions')
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
} 