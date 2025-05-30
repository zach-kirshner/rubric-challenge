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
        generateImprovedCriteria(activeCriteria, submission.prompt),
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
  // Extract a topic hint from the prompt
  const promptLower = originalPrompt.toLowerCase()
  const isClimateRelated = promptLower.includes('climate') || promptLower.includes('environment')
  const isTechRelated = promptLower.includes('technology') || promptLower.includes('software') || promptLower.includes('ai')
  const isBusinessRelated = promptLower.includes('business') || promptLower.includes('market') || promptLower.includes('company')
  
  if (isClimateRelated) {
    return {
      domainAnalysis: {
        topic: "Climate science and environmental impact",
        taskType: "Research and analysis task",
        currentFocus: "Environmental assessment"
      },
      improvedPrompt: `${originalPrompt.trim()} Your analysis must include: (1) Reference to at least 3 IPCC reports or peer-reviewed climate journals from 2020-2024, (2) Quantitative data on carbon emissions using standardized CO2e measurements, (3) Comparison of at least 2 different climate models (e.g., CMIP6 models), (4) Discussion of both mitigation and adaptation strategies with specific cost-benefit analysis, (5) Regional impact assessment for at least 3 different geographic areas.`,
      improvements: [
        {
          criterion: "RESEARCH_REQUIREMENTS",
          change: "Added requirement for IPCC reports and recent climate journals",
          reason: "Ensures students use authoritative climate science sources rather than general news articles",
          pointsGained: "15"
        },
        {
          criterion: "SYNTHESIS_AND_REASONING",
          change: "Required comparison of specific climate models and regional impacts",
          reason: "Forces analysis beyond simple data collection to understanding model differences and regional variations",
          pointsGained: "10"
        }
      ],
      contextualEnhancements: [
        {
          aspect: "Climate data specificity",
          enhancement: "Required use of standardized CO2e measurements",
          example: "Students must convert all emissions data to CO2 equivalent using IPCC conversion factors"
        }
      ],
      estimatedScore: {
        before: "70",
        after: "90",
        breakdown: {
          realism_and_interest: 18,
          difficulty_and_complexity: 18,
          research_requirements: 18,
          synthesis_and_reasoning: 14,
          universality_and_objectivity: 14,
          scope_and_specificity: 8
        }
      }
    }
  } else if (isTechRelated) {
    return {
      domainAnalysis: {
        topic: "Technology and software development",
        taskType: "Technical analysis or implementation task",
        currentFocus: "Technology evaluation"
      },
      improvedPrompt: `${originalPrompt.trim()} Your submission must include: (1) Analysis of at least 3 specific technical implementations with performance benchmarks, (2) Code examples or pseudocode demonstrating key concepts, (3) Comparison of time/space complexity using Big O notation, (4) Security vulnerability assessment using OWASP Top 10, (5) Scalability analysis with specific user load projections (e.g., 1K, 10K, 100K concurrent users).`,
      improvements: [
        {
          criterion: "DIFFICULTY_AND_COMPLEXITY",
          change: "Added requirement for performance benchmarks and complexity analysis",
          reason: "Requires deep technical understanding beyond surface-level descriptions",
          pointsGained: "15"
        },
        {
          criterion: "UNIVERSALITY_AND_OBJECTIVITY",
          change: "Required use of standard metrics (Big O, OWASP)",
          reason: "Provides objective evaluation criteria that experts would agree on",
          pointsGained: "10"
        }
      ],
      contextualEnhancements: [
        {
          aspect: "Technical depth",
          enhancement: "Required complexity analysis and security assessment",
          example: "Students must analyze algorithm efficiency and identify potential vulnerabilities"
        }
      ],
      estimatedScore: {
        before: "65",
        after: "88",
        breakdown: {
          realism_and_interest: 17,
          difficulty_and_complexity: 19,
          research_requirements: 16,
          synthesis_and_reasoning: 14,
          universality_and_objectivity: 14,
          scope_and_specificity: 8
        }
      }
    }
  }
  
  // Default fallback for other topics
  return {
    domainAnalysis: {
      topic: "General academic topic",
      taskType: "Research and analysis task",
      currentFocus: "Subject matter evaluation"
    },
    improvedPrompt: `${originalPrompt.trim()} Additionally, provide: (1) Analysis of 3-5 primary sources specific to this topic, (2) Quantitative data supporting your arguments, (3) Comparison of different theoretical frameworks or methodologies, (4) Real-world case studies or applications, (5) Critical evaluation of limitations and future directions.`,
    improvements: [
      {
        criterion: "RESEARCH_REQUIREMENTS",
        change: "Added requirement for primary sources and quantitative data",
        reason: "Ensures comprehensive research beyond surface-level information",
        pointsGained: "12"
      },
      {
        criterion: "SYNTHESIS_AND_REASONING",
        change: "Required framework comparison and critical evaluation",
        reason: "Promotes analytical thinking and synthesis of multiple perspectives",
        pointsGained: "8"
      }
    ],
    contextualEnhancements: [
      {
        aspect: "Research depth",
        enhancement: "Required primary sources and data analysis",
        example: "Students must cite original research and analyze raw data"
      }
    ],
    estimatedScore: {
      before: "70",
      after: "85",
      breakdown: {
        realism_and_interest: 16,
        difficulty_and_complexity: 17,
        research_requirements: 17,
        synthesis_and_reasoning: 13,
        universality_and_objectivity: 13,
        scope_and_specificity: 9
      }
    }
  }
}

function getMockCriteriaImprovements(criteria: any[]) {
  const sampleCriteria = criteria.slice(0, 3)
  
  // Try to detect domain from criteria content
  const allText = sampleCriteria.map(c => c.text).join(' ').toLowerCase()
  const isClimateRelated = allText.includes('climate') || allText.includes('environment') || allText.includes('carbon')
  const isTechRelated = allText.includes('code') || allText.includes('algorithm') || allText.includes('software')
  
  if (isClimateRelated) {
    return {
      taskContext: {
        domain: "Climate science and environmental assessment",
        keyObjectives: ["Evaluate climate impact", "Analyze mitigation strategies", "Assess adaptation measures"],
        specificSkillsAssessed: ["Climate data analysis", "Model interpretation", "Policy evaluation"]
      },
      improvements: sampleCriteria.map((c, i) => ({
        originalId: c.id,
        original: c.finalText || c.text,
        contextualIssues: ["Too generic for climate assessment", "Missing specific climate metrics"],
        improved: `${c.finalText || c.text} using IPCC AR6 methodology and includes specific CO2e calculations`,
        specificEnhancements: [
          {
            aspect: "Climate-specific metrics",
            domainRelevance: "Uses standardized climate science measurements",
            concreteExample: "Calculate emissions in metric tons CO2e using IPCC emission factors"
          }
        ]
      })),
      domainSpecificRecommendations: {
        missingCriteria: ["No criterion for uncertainty ranges in climate projections", "Missing requirement for regional impact assessment"],
        topicSpecificGaps: ["Climate model comparison not evaluated", "Adaptation strategies not assessed"],
        suggestedAdditions: [
          {
            criterion: "Includes uncertainty ranges (e.g., 1.5°C ± 0.2°C) for all climate projections",
            rationale: "Essential for scientific accuracy in climate assessments"
          }
        ]
      },
      contextualAlignment: {
        promptCriteriaAlignment: "Criteria need more climate-specific metrics and methodologies",
        domainCoverage: "Currently covers 60% of key climate assessment areas",
        improvementImpact: "+20 points by adding domain-specific requirements"
      }
    }
  } else if (isTechRelated) {
    return {
      taskContext: {
        domain: "Software engineering and technical analysis",
        keyObjectives: ["Evaluate technical implementation", "Analyze performance", "Assess scalability"],
        specificSkillsAssessed: ["Algorithm analysis", "Code quality", "System design"]
      },
      improvements: sampleCriteria.map((c, i) => ({
        originalId: c.id,
        original: c.finalText || c.text,
        contextualIssues: ["Missing technical specificity", "No performance metrics"],
        improved: `${c.finalText || c.text} with Big O complexity analysis and benchmark results`,
        specificEnhancements: [
          {
            aspect: "Performance metrics",
            domainRelevance: "Quantifies technical efficiency",
            concreteExample: "Provide runtime complexity (e.g., O(n log n)) and actual benchmark times"
          }
        ]
      })),
      domainSpecificRecommendations: {
        missingCriteria: ["No criterion for code quality metrics", "Missing security assessment"],
        topicSpecificGaps: ["Scalability not evaluated", "Error handling not assessed"],
        suggestedAdditions: [
          {
            criterion: "Code maintains cyclomatic complexity below 10 for all functions",
            rationale: "Industry standard for maintainable code"
          }
        ]
      },
      contextualAlignment: {
        promptCriteriaAlignment: "Criteria need more technical depth and measurable metrics",
        domainCoverage: "Currently covers 65% of software engineering best practices",
        improvementImpact: "+18 points by adding technical specificity"
      }
    }
  }
  
  // Default for other domains
  return {
    taskContext: {
      domain: "General academic evaluation",
      keyObjectives: ["Assess understanding", "Evaluate analysis", "Measure synthesis"],
      specificSkillsAssessed: ["Research skills", "Critical thinking", "Communication"]
    },
    improvements: sampleCriteria.map((c, i) => ({
      originalId: c.id,
      original: c.finalText || c.text,
      contextualIssues: ["Lacks domain specificity", "Missing measurable thresholds"],
      improved: `${c.finalText || c.text} with specific examples and quantifiable metrics`,
      specificEnhancements: [
        {
          aspect: "Measurable outcomes",
          domainRelevance: "Provides clear evaluation criteria",
          concreteExample: "Include specific numbers, percentages, or concrete examples"
        }
      ]
    })),
    domainSpecificRecommendations: {
      missingCriteria: ["Consider adding domain-specific evaluation criteria"],
      topicSpecificGaps: ["More context-specific requirements needed"],
      suggestedAdditions: [
        {
          criterion: "Addresses the specific context and requirements of the prompt",
          rationale: "Ensures relevance to the actual task"
        }
      ]
    },
    contextualAlignment: {
      promptCriteriaAlignment: "Criteria could be more tailored to the specific prompt",
      domainCoverage: "Generic coverage - needs domain specialization",
      improvementImpact: "+15 points with context-specific improvements"
    }
  }
}

async function generateImprovedPrompt(originalPrompt: string) {
  logger.info({ promptLength: originalPrompt.length }, 'Starting prompt improvement generation')
  
  const prompt = `You are an expert at creating educational assessment prompts. Your task is to provide SPECIFIC, CONTEXTUAL improvements to the given prompt based on its actual content and domain.

CRITICAL: Your suggestions must be SPECIFIC to this exact prompt's topic, not generic advice!

Original Prompt:
"${originalPrompt}"

First, identify:
1. The specific domain/topic of this prompt
2. The type of task being requested
3. The current strengths and weaknesses IN THE CONTEXT of this specific topic

Then provide improvements that directly address the evaluation criteria WHILE MAINTAINING THE CORE TOPIC AND INTENT:

1. REALISM AND INTEREST (20 points) - Make it practical and relevant to THIS SPECIFIC DOMAIN
2. DIFFICULTY AND COMPLEXITY (20 points) - Add complexity appropriate to THIS TOPIC
3. RESEARCH REQUIREMENTS (20 points) - Identify specific sources relevant to THIS SUBJECT
4. SYNTHESIS AND REASONING (15 points) - Add synthesis requirements specific to THIS DOMAIN
5. UNIVERSALITY AND OBJECTIVITY (15 points) - Clear success criteria for THIS SPECIFIC TASK
6. SCOPE AND SPECIFICITY (10 points) - Proper boundaries for THIS PARTICULAR ASSIGNMENT

Your improvements must:
- Be specific to the actual topic (e.g., if it's about climate change, suggest climate-specific improvements)
- Include concrete examples relevant to the domain
- Add requirements that make sense for this particular subject matter
- NOT be generic advice that could apply to any prompt

Respond in JSON format:
{
  "domainAnalysis": {
    "topic": "The specific topic/domain of this prompt",
    "taskType": "What kind of task this is",
    "currentFocus": "What the prompt currently emphasizes"
  },
  "improvedPrompt": "The improved prompt with SPECIFIC, CONTEXTUAL enhancements",
  "improvements": [
    {
      "criterion": "REALISM_AND_INTEREST|DIFFICULTY_AND_COMPLEXITY|RESEARCH_REQUIREMENTS|SYNTHESIS_AND_REASONING|UNIVERSALITY_AND_OBJECTIVITY|SCOPE_AND_SPECIFICITY",
      "change": "SPECIFIC change made (e.g., 'Added requirement to analyze 3 specific climate models' not 'Added analysis requirement')",
      "reason": "How this SPECIFICALLY helps for THIS topic",
      "pointsGained": "Estimated points gained"
    }
  ],
  "contextualEnhancements": [
    {
      "aspect": "Specific aspect of the topic enhanced",
      "enhancement": "Concrete, topic-specific improvement",
      "example": "Specific example of what student should do"
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
      system: 'You are an expert in educational assessment design who provides SPECIFIC, CONTEXTUAL improvements based on the actual content and domain of each prompt. You never give generic advice - every suggestion is tailored to the specific topic at hand. Always respond with valid JSON.',
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

async function generateImprovedCriteria(criteria: any[], originalPrompt: string) {
  logger.info({ criteriaCount: criteria.length }, 'Starting criteria improvement generation')
  
  // Select a subset of criteria to improve (5-7 most problematic ones)
  const criteriaToImprove = criteria.slice(0, 7).map(c => ({
    id: c.id,
    text: c.finalText || c.text,
    isPositive: c.isPositive
  }))
  
  logger.info({ selectedCount: criteriaToImprove.length }, 'Selected criteria for improvement')

  const prompt = `You are an expert at creating rubric criteria. Your task is to provide SPECIFIC, CONTEXTUAL improvements to these criteria based on the actual evaluation prompt.

CRITICAL: Your improvements must be SPECIFIC to this exact evaluation task, not generic!

ORIGINAL EVALUATION PROMPT:
"${originalPrompt}"

CURRENT CRITERIA TO IMPROVE:
${criteriaToImprove.map((c, i) => `${i + 1}. [${c.isPositive ? 'Positive' : 'Negative'}] "${c.text}"`).join('\n')}

First, understand:
1. What specific topic/domain is being evaluated
2. What the key evaluation goals are for THIS task
3. What specific knowledge/skills are being assessed

Then improve each criterion to be:
1. ATOMIC - One specific aspect, relevant to THIS topic
2. SELF-CONTAINED - Include specific thresholds/values relevant to THIS domain
3. CONTEXTUAL - Use terminology and requirements specific to THIS subject
4. MEASURABLE - Clear pass/fail conditions for THIS particular task

EXAMPLE OF BAD (GENERIC) vs GOOD (SPECIFIC) improvements:
BAD: "Mentions at least 3 sources" 
GOOD: "Cites at least 3 peer-reviewed climate science journals published after 2020"

BAD: "Provides analysis"
GOOD: "Analyzes the carbon footprint implications using IPCC methodology"

Your improvements must:
- Reference specific concepts from the prompt's domain
- Include concrete values/thresholds relevant to the topic
- Use domain-specific terminology
- Be clearly evaluable in the context of THIS assignment

Respond in JSON format:
{
  "taskContext": {
    "domain": "Specific domain/topic of the evaluation",
    "keyObjectives": ["Main objectives of THIS evaluation task"],
    "specificSkillsAssessed": ["Concrete skills being evaluated"]
  },
  "improvements": [
    {
      "originalId": "criterion id",
      "original": "original text",
      "contextualIssues": ["Why this is too generic for THIS task"],
      "improved": "SPECIFIC improved version with domain-relevant details",
      "specificEnhancements": [
        {
          "aspect": "What was made more specific",
          "domainRelevance": "How it relates to THIS topic",
          "concreteExample": "Example of what would meet this criterion"
        }
      ]
    }
  ],
  "domainSpecificRecommendations": {
    "missingCriteria": ["SPECIFIC criteria missing for THIS topic (e.g., 'No criterion for statistical significance in research findings')"],
    "topicSpecificGaps": ["Gaps specific to evaluating THIS subject matter"],
    "suggestedAdditions": [
      {
        "criterion": "Specific new criterion text",
        "rationale": "Why this is essential for THIS evaluation task"
      }
    ]
  },
  "contextualAlignment": {
    "promptCriteriaAlignment": "How well criteria match THIS specific prompt",
    "domainCoverage": "Coverage of key aspects of THIS topic",
    "improvementImpact": "Expected improvement for evaluating THIS specific task"
  }
}`

  try {
    const message = await anthropic.messages.create({
      model: getModelForTask('rubricGeneration'),
      max_tokens: TASK_CONFIGS.rubricGeneration.maxTokens,
      temperature: TASK_CONFIGS.rubricGeneration.temperature,
      system: 'You are an expert in rubric design who provides SPECIFIC, CONTEXTUAL improvements based on the actual evaluation task. You understand that generic suggestions are useless - every improvement must be tailored to the specific domain and objectives of the prompt. Always respond with valid JSON.',
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