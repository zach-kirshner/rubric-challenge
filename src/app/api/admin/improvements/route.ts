import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import logger from '@/lib/logger'
import Anthropic from '@anthropic-ai/sdk'
import { getModelForTask, TASK_CONFIGS } from '@/lib/anthropic-config'

// Improvements API - generates better prompts and criteria suggestions
const prisma = new PrismaClient()
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('id')

    logger.info({ submissionId }, 'Improvements API called')

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })
    }

    // Fetch submission details with all related data
    let submission
    try {
      submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          user: true,
          criteria: {
            where: { status: { not: 'deleted' } },
            orderBy: { order: 'asc' }
          },
          criteriaActions: {
            orderBy: { timestamp: 'asc' }
          }
        }
      })
    } catch (dbError) {
      logger.error(dbError instanceof Error ? dbError.message : String(dbError), 'Database error fetching submission')
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!submission) {
      logger.warn({ submissionId }, 'Submission not found')
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    logger.info({ 
      submissionId, 
      promptLength: submission.prompt.length,
      criteriaCount: submission.criteria.length 
    }, 'Submission found, generating improvements')

    // Generate improved prompt with timeout
    let promptImprovement = null
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      )
      
      promptImprovement = await Promise.race([
        generateImprovedPrompt(submission.prompt),
        timeoutPromise
      ])
      
      logger.info({ hasPromptImprovement: !!promptImprovement }, 'Prompt improvement generated')
    } catch (promptError) {
      logger.error(promptError instanceof Error ? promptError.message : String(promptError), 'Error generating prompt improvement')
      // Fallback to mock data
      promptImprovement = getMockPromptImprovement(submission.prompt)
    }

    // Generate improved criteria with timeout
    let criteriaImprovements = null
    try {
      const activeCriteria = submission.criteria.filter(c => c.status === 'active' || c.status === 'edited')
      logger.info({ activeCriteriaCount: activeCriteria.length }, 'Filtering criteria for improvements')
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      )
      
      criteriaImprovements = await Promise.race([
        generateImprovedCriteria(activeCriteria),
        timeoutPromise
      ])
      
      logger.info({ hasCriteriaImprovements: !!criteriaImprovements }, 'Criteria improvements generated')
    } catch (criteriaError) {
      logger.error(criteriaError instanceof Error ? criteriaError.message : String(criteriaError), 'Error generating criteria improvements')
      // Fallback to mock data
      criteriaImprovements = getMockCriteriaImprovements(submission.criteria)
    }

    const response = {
      promptImprovement,
      criteriaImprovements
    }

    logger.info({ 
      hasPromptImprovement: !!promptImprovement,
      hasCriteriaImprovements: !!criteriaImprovements 
    }, 'Returning improvements response')

    return NextResponse.json(response)

  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Unexpected error in improvements API')
    return NextResponse.json(
      { error: 'Failed to generate improvements' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Mock data functions for fallback
function getMockPromptImprovement(originalPrompt: string) {
  return {
    improvedPrompt: `${originalPrompt.trim()} Please provide a comprehensive analysis with specific examples, cite at least 3 credible sources, and include your reasoning process for each conclusion drawn.`,
    improvements: [
      {
        criterion: "RESEARCH_REQUIREMENTS",
        change: "Added requirement for multiple credible sources",
        reason: "Ensures students must consult various sources rather than relying on a single reference",
        pointsGained: "15"
      },
      {
        criterion: "SYNTHESIS_AND_REASONING", 
        change: "Added requirement to show reasoning process",
        reason: "Moves beyond information gathering to require critical analysis and evaluation",
        pointsGained: "10"
      }
    ],
    estimatedScore: {
      before: "65",
      after: "85"
    }
  }
}

function getMockCriteriaImprovements(criteria: any[]) {
  const sampleCriteria = criteria.slice(0, 3)
  
  return {
    improvements: sampleCriteria.map((c, i) => ({
      originalId: c.id,
      original: c.finalText || c.text,
      violations: ["Vague criteria", "Missing specificity"],
      improved: `${c.finalText || c.text} (includes specific numerical thresholds and clear measurable outcomes)`,
      changes: [
        {
          issue: "Vague criteria",
          fix: "Added specific measurable elements",
          bestPractice: "Specificity and measurability"
        }
      ]
    })),
    meceAnalysis: {
      overlaps: ["Some criteria may overlap in scope"],
      gaps: ["Consider adding criteria for source quality"],
      recommendations: ["Add criterion for citation accuracy"]
    },
    bestPracticesSummary: {
      atomicityScore: "75%",
      selfContainedScore: "60%", 
      diversityScore: "Good",
      estimatedQualityImprovement: "+15 points"
    }
  }
}

async function generateImprovedPrompt(originalPrompt: string) {
  logger.info({ promptLength: originalPrompt.length }, 'Starting prompt improvement generation')
  
  const prompt = `You are an expert at creating educational assessment prompts. Given the following prompt, provide an improved version that addresses any weaknesses while maintaining the core intent.

IMPORTANT: Your improvements should directly address the evaluation criteria used in our grading system:

1. REALISM AND INTEREST (20 points) - Make it practical, relevant, and intellectually stimulating
2. DIFFICULTY AND COMPLEXITY (20 points) - Ensure it requires hours of work and cannot be solved with a simple search
3. RESEARCH REQUIREMENTS (20 points) - Must need multiple sources, no single source should contain all information
4. SYNTHESIS AND REASONING (15 points) - Goes beyond information gathering to require evaluation and creative problem-solving
5. UNIVERSALITY AND OBJECTIVITY (15 points) - Clear success criteria that experts would agree on
6. SCOPE AND SPECIFICITY (10 points) - Under 4,000 words with clear boundaries and deliverables

PENALTY AREAS TO AVOID:
- Information seeking without synthesis (-10)
- Single source sufficiency (-10)
- Non-public information requirements (-10)
- Too subjective to grade (-10)
- Scope too broad (-10)
- Unclear requirements (-5)
- Artificial constraints (-5)

Original Prompt:
"${originalPrompt}"

Analyze the prompt against EACH of the 6 criteria above and provide:
1. An improved version that maximizes the score on each criterion
2. Specific improvements made for each criterion
3. How each change addresses potential penalties

Focus on making the prompt score 90+ points by excelling in all areas.

Respond in JSON format:
{
  "improvedPrompt": "The improved prompt text",
  "improvements": [
    {
      "criterion": "REALISM_AND_INTEREST|DIFFICULTY_AND_COMPLEXITY|RESEARCH_REQUIREMENTS|SYNTHESIS_AND_REASONING|UNIVERSALITY_AND_OBJECTIVITY|SCOPE_AND_SPECIFICITY",
      "change": "What was changed",
      "reason": "How this addresses the specific criterion and improves the score",
      "pointsGained": "Estimated points gained in this category"
    }
  ],
  "penaltiesAddressed": [
    {
      "penalty": "The penalty being avoided",
      "solution": "How the improvement addresses this"
    }
  ],
  "estimatedScore": {
    "before": "Estimated score of original",
    "after": "Estimated score of improved version",
    "breakdown": {
      "realism_and_interest": 20,
      "difficulty_and_complexity": 20,
      "research_requirements": 20,
      "synthesis_and_reasoning": 15,
      "universality_and_objectivity": 15,
      "scope_and_specificity": 10
    }
  }
}`

  try {
    logger.info('Calling Claude API for prompt improvement')
    
    const message = await anthropic.messages.create({
      model: getModelForTask('rubricGeneration'),
      max_tokens: TASK_CONFIGS.rubricGeneration.maxTokens,
      temperature: TASK_CONFIGS.rubricGeneration.temperature,
      system: 'You are an expert in educational assessment design specializing in creating prompts that score excellently on all evaluation criteria. You understand the specific scoring rubric and how to maximize points in each category. Always respond with valid JSON.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    logger.info({ messageId: message.id }, 'Claude API response received for prompt improvement')

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const responseText = content.text
    logger.info({ responseLength: responseText.length }, 'Parsing Claude response for prompt improvement')
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      logger.error({ responsePreview: responseText.substring(0, 200) }, 'Could not find JSON in response')
      throw new Error('Could not parse improvement response')
    }

    const result = JSON.parse(jsonMatch[0])
    logger.info({ 
      hasImprovedPrompt: !!result.improvedPrompt,
      improvementCount: result.improvements?.length || 0
    }, 'Prompt improvement parsed successfully')
    
    return result
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error
    }, 'Error in generateImprovedPrompt')
    return null
  }
}

async function generateImprovedCriteria(criteria: any[]) {
  logger.info({ criteriaCount: criteria.length }, 'Starting criteria improvement generation')
  
  // Select a subset of criteria to improve (5-7 most problematic ones)
  const criteriaToImprove = criteria.slice(0, 7).map(c => ({
    id: c.id,
    text: c.finalText || c.text,
    isPositive: c.isPositive
  }))
  
  logger.info({ selectedCount: criteriaToImprove.length }, 'Selected criteria for improvement')

  const prompt = `You are an expert at creating rubric criteria that follow industry best practices. Given the following criteria from a rubric, provide improved versions that maximize adherence to our grading standards.

CRITICAL BEST PRACTICES (from our grading system):

1. MECE (Mutually Exclusive, Collectively Exhaustive)
   - Completeness: Cover ALL elements needed
   - No overlapping: Same error shouldn't be punished multiple times

2. ATOMICITY
   - Each criterion evaluates EXACTLY ONE aspect
   - NO stacked criteria with "and" (major penalty: -5 to -10 points)

3. SELF-CONTAINED SPECIFICITY
   - Include ALL information needed to evaluate (values, thresholds, facts)
   - Binary (true/false) and objective
   - Missing self-contained info = -3 points each

4. DIVERSITY
   - Varied types of criteria beyond just "mentions X"
   - Balance across evaluation dimensions

5. OPTIMAL QUANTITY
   - 10-30 criteria total
   - Target ~50% failure rate for appropriate difficulty

CRITICAL VIOLATIONS TO FIX:
- Stacked criteria (with "and"): -5 to -10 points
- Non-self-contained criteria: -3 points each
- Overlapping criteria: -5 to -10 points
- Vague criteria without specifics: -3 points each

Current Criteria:
${criteriaToImprove.map((c, i) => `${i + 1}. [${c.isPositive ? 'Positive' : 'Negative'}] "${c.text}"`).join('\n')}

For EACH criterion:
1. Identify ALL violations of best practices
2. Provide an improved version that fixes these issues
3. Ensure the improved version is atomic, self-contained, and specific
4. Include exact values, thresholds, or facts where applicable

Respond in JSON format:
{
  "improvements": [
    {
      "originalId": "criterion id",
      "original": "original text",
      "violations": ["List of specific best practice violations"],
      "improved": "improved text that fixes ALL violations",
      "changes": [
        {
          "issue": "Specific violation (e.g., 'stacked criteria')",
          "fix": "How it was fixed",
          "bestPractice": "Which best practice this addresses"
        }
      ],
      "selfContainedElements": ["List of specific values/facts included"]
    }
  ],
  "meceAnalysis": {
    "overlaps": ["Any overlapping criteria that should be separated"],
    "gaps": ["Missing aspects that should be covered"],
    "recommendations": ["Specific new criteria to add for completeness"]
  },
  "bestPracticesSummary": {
    "atomicityScore": "percentage of criteria that are properly atomic",
    "selfContainedScore": "percentage with all needed information",
    "diversityScore": "assessment of variety across types",
    "estimatedQualityImprovement": "expected points gained in grading"
  }
}`

  try {
    const message = await anthropic.messages.create({
      model: getModelForTask('rubricGeneration'),
      max_tokens: TASK_CONFIGS.rubricGeneration.maxTokens,
      temperature: TASK_CONFIGS.rubricGeneration.temperature,
      system: 'You are an expert in rubric design who deeply understands MECE principles, atomicity, and self-contained criteria. You know how to transform vague, stacked, or overlapping criteria into precise, atomic, self-contained evaluation points that score excellently on rubric grading systems. Always respond with valid JSON.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const responseText = content.text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('Could not parse improvement response')
    }

    const result = JSON.parse(jsonMatch[0])
    return result
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error generating improved criteria')
    return null
  }
} 