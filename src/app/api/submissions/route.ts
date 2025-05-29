import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { RubricItem, Action, Criterion, CriterionAction } from '@/types'
import Anthropic from '@anthropic-ai/sdk'
import { RUBRIC_GRADER_SYSTEM_PROMPT } from '@/lib/rubric-grader-prompt'
import { PROMPT_GRADER_SYSTEM_PROMPT } from '@/lib/prompt-grader-prompt'
import databaseService from '@/lib/database-service'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Mock grading functions for local development
const createMockPromptGrade = (prompt: string) => {
  return {
    "score": 85,
    "grade": "B+",
    "breakdown": {
      "clarity": 8,
      "specificity": 7,
      "feasibility": 9,
      "scope": 8
    },
    "strengths": [
      "Clear and well-defined task",
      "Specific requirements provided",
      "Reasonable scope for evaluation"
    ],
    "weaknesses": [
      "Could benefit from more specific examples",
      "Some edge cases might not be covered"
    ]
  }
}

const createMockSubmissionGrade = (submission: any) => {
  const editCount = submission.criteriaActions?.filter((a: any) => a.actionType === 'edit').length || 0
  const addCount = submission.criteriaActions?.filter((a: any) => a.actionType === 'add').length || 0
  const deleteCount = submission.criteriaActions?.filter((a: any) => a.actionType === 'delete').length || 0
  
  // Generate a realistic score based on changes made
  let score = 75 + Math.min(editCount * 2, 10) + Math.min(addCount * 3, 15) + Math.min(deleteCount * 1, 5)
  score = Math.min(score, 95) // Cap at 95
  
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F"
  
  return {
    "score": score,
    "grade": grade,
    "breakdown": {
      "relevance_coverage": Math.min(Math.round(score * 0.25), 25),
      "specificity_measurability": Math.min(Math.round(score * 0.25), 25), 
      "user_improvements": Math.min(Math.round(score * 0.20), 20),
      "justification_quality": Math.min(Math.round(score * 0.15), 15),
      "structure_organization": Math.min(Math.round(score * 0.10), 10),
      "overall_quality": Math.min(Math.round(score * 0.05), 5)
    },
    "strengths": [
      "Good engagement with the rubric",
      "Thoughtful modifications made",
      "Shows understanding of evaluation criteria"
    ],
    "weaknesses": [
      "Some criteria could be more specific",
      "Consider adding more edge cases"
    ],
    "summary": "This is a mock grading response for local development. The actual grading would provide more detailed analysis.",
    "specific_feedback": {
      "best_change": {
        "criterion": "Example of a well-improved criterion",
        "reason": "Made the criterion more specific and measurable"
      },
      "worst_change": {
        "criterion": "Example of a problematic change", 
        "issue": "Made the criterion too vague or removed important details"
      },
      "justification_analysis": {
        "strong_justifications": ["Clear reasoning provided", "Good understanding of task requirements"],
        "weak_justifications": ["Vague explanation", "Doesn't address specific issues"]
      }
    },
    "penalties_applied": []
  }
}

// Function to grade the prompt
async function gradePrompt(prompt: string) {
  try {
    logger.info({ promptLength: prompt.length }, 'Starting prompt grading')
    
    // Check if we're in local development mode
    if (process.env.ANTHROPIC_API_KEY === 'local-development-placeholder') {
      logger.info('Using mock prompt grading for local development')
      return createMockPromptGrade(prompt)
    }
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      system: PROMPT_GRADER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please evaluate the following prompt for an LLM evaluation task:\n\n${prompt}`
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const responseText = content.text
    logger.info({ responseLength: responseText.length }, 'Received prompt grading response')
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      logger.error({ responseText }, 'Could not find JSON in prompt grading response')
      throw new Error('Could not parse prompt grading response')
    }

    const promptGrade = JSON.parse(jsonMatch[0])
    
    logger.info({ 
      score: promptGrade.score,
      grade: promptGrade.grade,
      hasBreakdown: !!promptGrade.breakdown,
      hasStrengths: !!promptGrade.strengths,
      hasWeaknesses: !!promptGrade.weaknesses
    }, 'Prompt graded successfully')

    return promptGrade
  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Error grading prompt')
    return null
  }
}

// Function to grade a submission
async function gradeSubmission(submission: any) {
  try {
    logger.info({ submissionId: submission.id }, 'Starting submission grading')
    
    // Check if we're in local development mode
    if (process.env.ANTHROPIC_API_KEY === 'local-development-placeholder') {
      logger.info({ submissionId: submission.id }, 'Using mock submission grading for local development')
      
      // Grade the prompt first (mock)
      const promptGrade = await gradePrompt(submission.prompt)
      const mockGrade = createMockSubmissionGrade(submission)
      
      if (promptGrade) {
        (mockGrade as any).promptGrade = promptGrade
      }
      
      return mockGrade
    }
    
    // Grade the prompt first
    const promptGrade = await gradePrompt(submission.prompt)
    
    if (!promptGrade) {
      logger.warn({ submissionId: submission.id }, 'Prompt grading failed, continuing with rubric grading')
    } else {
      logger.info({ 
        submissionId: submission.id, 
        promptScore: promptGrade.score,
        promptGrade: promptGrade.grade 
      }, 'Prompt graded successfully')
    }
    
    // Prepare the data for rubric grading
    const originalRubric = submission.criteria
      .filter((c: any) => c.source === 'ai_generated')
      .map((c: any) => ({
        id: c.originalId,
        criterion: c.text,
        isPositive: c.isPositive
      }))

    const finalRubric = submission.criteria
      .filter((c: any) => c.status !== 'deleted')
      .map((c: any) => ({
        id: c.originalId,
        criterion: c.finalText || c.text,
        isPositive: c.isPositive,
        source: c.source,
        status: c.status
      }))

    const userActions = submission.criteriaActions.map((action: any) => ({
      type: action.actionType,
      criterionId: action.criterionId,
      previousText: action.previousText,
      newText: action.newText,
      justification: action.justification,
      timestamp: action.timestamp
    }))

    // Create the grading prompt
    const gradingPrompt = `
ORIGINAL_PROMPT:
${submission.prompt}

AI_GENERATED_RUBRIC (${originalRubric.length} criteria):
${originalRubric.map((item: any, index: number) => 
  `${index + 1}. [${item.isPositive ? '+' : '-'}] ${item.criterion}`
).join('\n')}

USER_ACTIONS (${userActions.length} total changes):
${userActions.length > 0 ? userActions.map((action: any, index: number) => {
  if (action.type === 'edit') {
    return `
${index + 1}. EDIT:
   Original: "${action.previousText}"
   Changed to: "${action.newText}"
   Justification: "${action.justification}"
   Time: ${new Date(action.timestamp).toLocaleTimeString()}`
  } else if (action.type === 'delete') {
    return `
${index + 1}. DELETE:
   Removed: "${action.previousText}"
   Justification: "${action.justification}"
   Time: ${new Date(action.timestamp).toLocaleTimeString()}`
  } else if (action.type === 'add') {
    return `
${index + 1}. ADD:
   New criterion: "${action.newText}"
   Justification: "${action.justification}"
   Time: ${new Date(action.timestamp).toLocaleTimeString()}`
  }
  return ''
}).join('\n') : 'NO CHANGES MADE - User submitted the AI-generated rubric without any modifications'}

FINAL_RUBRIC (${finalRubric.length} criteria):
${finalRubric.map((item: any, index: number) => {
  let status = ''
  if (item.source === 'user_added') status = ' [USER ADDED]'
  else if (item.status === 'edited') status = ' [EDITED]'
  else if (item.status === 'deleted') status = ' [DELETED - NOT IN FINAL]'
  
  return `${index + 1}. [${item.isPositive ? '+' : '-'}] ${item.criterion}${status}`
}).join('\n')}

SUMMARY OF CHANGES:
- Original criteria: ${originalRubric.length}
- Final criteria: ${finalRubric.filter((c: any) => c.status !== 'deleted').length}
- Edits made: ${userActions.filter((a: any) => a.type === 'edit').length}
- Additions made: ${userActions.filter((a: any) => a.type === 'add').length}
- Deletions made: ${userActions.filter((a: any) => a.type === 'delete').length}

Please evaluate this rubric according to the evaluation framework. Pay special attention to:
1. Whether changes actually improve the rubric or make it worse
2. The quality and specificity of justifications provided
3. Whether the user understood the evaluation task

Provide your assessment in the specified JSON format.`

    // Call Claude to grade the rubric
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      system: RUBRIC_GRADER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: gradingPrompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse the grading response
    const responseText = content.text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('Could not parse grading response')
    }

    const gradingResult = JSON.parse(jsonMatch[0])
    
    // Add prompt grade to the grading result
    if (promptGrade) {
      logger.info({ 
        submissionId: submission.id,
        hasPromptGrade: true,
        promptScore: promptGrade.score
      }, 'Adding prompt grade to grading result')
      gradingResult.promptGrade = promptGrade
    } else {
      logger.warn({ submissionId: submission.id }, 'No prompt grade to add to grading result')
    }

    // Store the grading result with the submission
    submission.gradingResult = gradingResult
    submission.gradedAt = new Date()

    logger.info({ 
      submissionId: submission.id, 
      rubricScore: gradingResult.score,
      rubricGrade: gradingResult.grade,
      promptScore: promptGrade?.score,
      promptGrade: promptGrade?.grade,
      hasPromptGradeInResult: !!gradingResult.promptGrade
    }, 'Submission graded automatically')

    return gradingResult
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error auto-grading submission')
    // Don't throw - we still want to save the submission even if grading fails
    return null
  }
}

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
    
    // Automatically grade the submission
    logger.info({ submissionId }, 'Auto-grading submission')
    const gradingResult = await gradeSubmission(submission)
    
    // Update submission with grading result
    if (gradingResult) {
      await databaseService.updateSubmission(submissionId, {
        gradingResult,
        gradedAt: new Date()
      })
    }
    
    logger.info({ 
      submissionId,
      email: email.toLowerCase(),
      fullName,
      criteriaCount: criteria.length,
      actionsCount: criteriaActions.length,
      deletedCount: criteria.filter(c => c.status === 'deleted').length,
      editedCount: criteria.filter(c => c.status === 'edited').length,
      addedCount: criteria.filter(c => c.source === 'user_added').length,
      score: gradingResult?.score,
      grade: gradingResult?.grade
    }, 'Submission created and graded successfully')

    return NextResponse.json({ 
      success: true, 
      submissionId,
      message: 'Submission received successfully'
    })
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error processing submission')
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    )
  }
}

// Export for use in admin API - now using the store

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