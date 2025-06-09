import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import databaseService from '@/lib/database-service'
import Anthropic from '@anthropic-ai/sdk'
import { RUBRIC_GRADER_SYSTEM_PROMPT } from '@/lib/rubric-grader-prompt'
import { PROMPT_GRADER_SYSTEM_PROMPT } from '@/lib/prompt-grader-prompt'
import { getModelForTask, TASK_CONFIGS } from '@/lib/anthropic-config'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function GET(request: NextRequest) {
  try {
    // Get all submissions
    const allSubmissions = await databaseService.getAllSubmissions()
    
    // Filter ungraded submissions
    const ungradedSubmissions = allSubmissions.filter(submission => !submission.gradingResult)
    
    logger.info({ 
      totalSubmissions: allSubmissions.length,
      ungradedCount: ungradedSubmissions.length 
    }, 'Checked for ungraded submissions')
    
    return NextResponse.json({
      totalSubmissions: allSubmissions.length,
      ungradedCount: ungradedSubmissions.length,
      ungradedSubmissions: ungradedSubmissions.map(s => ({
        id: s.id,
        email: s.email,
        fullName: s.fullName,
        submittedAt: s.submittedAt,
        prompt: s.prompt.substring(0, 100) + '...'
      }))
    })
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error checking ungraded submissions')
    return NextResponse.json(
      { error: 'Failed to check ungraded submissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gradeAll } = body
    
    // Get all submissions
    const allSubmissions = await databaseService.getAllSubmissions()
    
    // Filter ungraded submissions
    const ungradedSubmissions = allSubmissions.filter(submission => !submission.gradingResult)
    
    if (ungradedSubmissions.length === 0) {
      return NextResponse.json({
        message: 'No ungraded submissions found',
        gradedCount: 0
      })
    }
    
    logger.info({ count: ungradedSubmissions.length }, 'Found ungraded submissions to grade')
    
    const results = []
    
    // Add rate limiting - process in batches with delays
    const BATCH_SIZE = 5
    const DELAY_BETWEEN_BATCHES = 2000 // 2 seconds
    
    for (let i = 0; i < ungradedSubmissions.length; i += BATCH_SIZE) {
      const batch = ungradedSubmissions.slice(i, i + BATCH_SIZE)
      
      // Process batch in parallel
      const batchPromises = batch.map(async (submission) => {
        try {
          logger.info({ submissionId: submission.id }, 'Grading submission')
          
          // Grade both prompt and rubric in parallel
          const [rubricGradeResult, promptGradeResult] = await Promise.all([
            gradeRubric(submission),
            gradePrompt(submission.prompt)
          ])
          
          // Combine results
          const combinedResult = {
            ...rubricGradeResult,
            promptGrade: promptGradeResult
          }
          
          // Update submission with grading result
          await databaseService.updateSubmission(submission.id, {
            gradingResult: combinedResult,
            gradedAt: new Date()
          })
          
          logger.info({ 
            submissionId: submission.id,
            rubricScore: rubricGradeResult.score,
            promptScore: promptGradeResult?.score
          }, 'Successfully graded submission')
          
          return {
            id: submission.id,
            success: true,
            rubricScore: rubricGradeResult.score,
            promptScore: promptGradeResult?.score
          }
        } catch (error) {
          logger.error({ 
            submissionId: submission.id,
            error: error instanceof Error ? error.message : String(error)
          }, 'Failed to grade submission')
          
          return {
            id: submission.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < ungradedSubmissions.length) {
        logger.info({ 
          processed: i + BATCH_SIZE, 
          total: ungradedSubmissions.length 
        }, 'Batch completed, waiting before next batch...')
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    }
    
    const successCount = results.filter(r => r.success).length
    
    return NextResponse.json({
      message: `Graded ${successCount} out of ${ungradedSubmissions.length} submissions`,
      gradedCount: successCount,
      failedCount: ungradedSubmissions.length - successCount,
      results
    })
    
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error grading submissions')
    return NextResponse.json(
      { error: 'Failed to grade submissions' },
      { status: 500 }
    )
  }
}

async function gradeRubric(submission: any) {
  // Check API key validity first
  const apiKey = process.env.ANTHROPIC_API_KEY
  const isValidApiKey = apiKey && 
                       apiKey.startsWith('sk-ant-') && 
                       apiKey.length > 50 &&
                       apiKey !== 'local-development-placeholder'
  
  if (!isValidApiKey) {
    logger.warn({
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      submissionId: submission.id
    }, 'Invalid API key for rubric grading')
    throw new Error('Invalid or missing Anthropic API key')
  }
  
  // Prepare the data for grading
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
    model: getModelForTask('rubricGrading'),
    max_tokens: TASK_CONFIGS.rubricGrading.maxTokens,
    temperature: TASK_CONFIGS.rubricGrading.temperature,
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
  
  // Cap the score at 100 since bonuses can exceed the maximum
  if (gradingResult.score > 100) {
    logger.info({ 
      originalScore: gradingResult.score,
      cappedScore: 100 
    }, 'Capping rubric score at 100')
    gradingResult.score = 100
  }
  
  return gradingResult
}

async function gradePrompt(prompt: string) {
  try {
    // Check API key validity first
    const apiKey = process.env.ANTHROPIC_API_KEY
    const isValidApiKey = apiKey && 
                         apiKey.startsWith('sk-ant-') && 
                         apiKey.length > 50 &&
                         apiKey !== 'local-development-placeholder'
    
    if (!isValidApiKey) {
      logger.warn({
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0
      }, 'Invalid API key for prompt grading')
      return null // Return null instead of throwing to allow partial grading
    }
    
    // Create the grading prompt
    const gradingPrompt = `Please evaluate the following task prompt according to the evaluation framework:

TASK PROMPT TO EVALUATE:
${prompt}

Analyze this prompt carefully across all dimensions and provide your evaluation in the specified JSON format.`

    // Call Claude to grade the prompt
    const message = await anthropic.messages.create({
      model: getModelForTask('promptGrading'),
      max_tokens: TASK_CONFIGS.promptGrading.maxTokens,
      temperature: TASK_CONFIGS.promptGrading.temperature,
      system: PROMPT_GRADER_SYSTEM_PROMPT,
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

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error grading prompt')
    // Return null if prompt grading fails - we don't want to fail the whole request
    return null
  }
} 