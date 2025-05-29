import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import Anthropic from '@anthropic-ai/sdk'
import { PROMPT_GRADER_SYSTEM_PROMPT } from '@/lib/prompt-grader-prompt'
import { getModelForTask, TASK_CONFIGS } from '@/lib/anthropic-config'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    logger.info({ promptLength: prompt.length }, 'Grading prompt')

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

    const gradingResult = JSON.parse(jsonMatch[0])

    logger.info({ 
      score: gradingResult.score,
      grade: gradingResult.grade 
    }, 'Prompt graded successfully')

    return NextResponse.json(gradingResult)
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error grading prompt')
    return NextResponse.json(
      { error: 'Failed to grade prompt' },
      { status: 500 }
    )
  }
} 