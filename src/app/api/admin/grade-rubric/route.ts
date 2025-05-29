import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import databaseService from '@/lib/database-service'
import Anthropic from '@anthropic-ai/sdk'
import { RUBRIC_GRADER_SYSTEM_PROMPT } from '@/lib/rubric-grader-prompt'
import { PROMPT_GRADER_SYSTEM_PROMPT } from '@/lib/prompt-grader-prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { submissionId } = body

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Find the submission
    const submission = await databaseService.getSubmission(submissionId)
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    logger.info({ submissionId }, 'Grading submission')

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

    logger.info({ 
      submissionId,
      rubricScore: rubricGradeResult.score,
      rubricGrade: rubricGradeResult.grade,
      promptScore: promptGradeResult?.score,
      promptGrade: promptGradeResult?.grade
    }, 'Submission graded successfully')

    return NextResponse.json(combinedResult)
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error grading submission')
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    )
  }
}

async function gradeRubric(submission: any) {
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

  return JSON.parse(jsonMatch[0])
}

async function gradePrompt(prompt: string) {
  try {
    // Create the grading prompt
    const gradingPrompt = `Please evaluate the following task prompt according to the evaluation framework:

TASK PROMPT TO EVALUATE:
${prompt}

Analyze this prompt carefully across all dimensions and provide your evaluation in the specified JSON format.`

    // Call Claude to grade the prompt
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
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