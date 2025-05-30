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

async function gradePrompt(prompt: string) {
  try {
    logger.info({ promptLength: prompt.length }, 'Starting prompt grading')
    
    // Check if we're in local development mode
    if (process.env.ANTHROPIC_API_KEY === 'local-development-placeholder') {
      logger.info('Using mock prompt grading for local development')
      return createMockPromptGrade(prompt)
    }
    
    const gradingPrompt = `
Please grade this educational prompt according to our evaluation framework:

PROMPT:
"${prompt}"

Evaluate across these dimensions and provide specific feedback and scoring.

Respond in JSON format:
{
  "score": number (0-100),
  "grade": "letter grade",
  "breakdown": {
    "clarity": number (0-10),
    "specificity": number (0-10), 
    "feasibility": number (0-10),
    "scope": number (0-10)
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}`

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

    const responseText = content.text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('Could not parse prompt grading response')
    }

    const result = JSON.parse(jsonMatch[0])
    logger.info({ score: result.score, grade: result.grade }, 'Prompt graded successfully')
    return result
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error grading prompt')
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
    const { submissionId } = body

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    logger.info({ submissionId }, 'Starting background grading')

    // Find the submission
    const submission = await databaseService.getSubmission(submissionId)
    
    if (!submission) {
      logger.error({ submissionId }, 'Submission not found for background grading')
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if already graded and has improvements
    const hasImprovements = submission.gradingResult?.improvements
    if (submission.gradingResult && hasImprovements) {
      logger.info({ submissionId }, 'Submission already graded with improvements, skipping')
      return NextResponse.json({ 
        success: true, 
        message: 'Already graded',
        score: submission.gradingResult.score 
      })
    }

    try {
      // Grade the submission and generate improvements in parallel
      const [gradingResult, improvements] = await Promise.all([
        submission.gradingResult && !submission.gradingResult.improvements ? Promise.resolve(submission.gradingResult) : gradeSubmission(submission),
        hasImprovements ? Promise.resolve(submission.gradingResult.improvements) : generateImprovements(submission)
      ])
      
      // Combine grading result with improvements
      let finalGradingResult = gradingResult
      if (gradingResult && improvements) {
        finalGradingResult = {
          ...gradingResult,
          improvements: improvements
        }
      }
      
      // Update submission with combined result
      if (finalGradingResult && (!submission.gradingResult || !hasImprovements)) {
        await databaseService.updateSubmission(submissionId, {
          gradingResult: finalGradingResult,
          gradedAt: new Date()
        })
        
        logger.info({ 
          submissionId,
          score: finalGradingResult?.score,
          grade: finalGradingResult?.grade,
          promptScore: finalGradingResult?.promptGrade?.score,
          promptGrade: finalGradingResult?.promptGrade?.grade,
          hasImprovements: !!finalGradingResult?.improvements
        }, 'Background grading and improvements completed successfully')
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Grading and improvements completed',
        score: finalGradingResult?.score,
        grade: finalGradingResult?.grade,
        hasImprovements: !!finalGradingResult?.improvements
      })
      
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error), 'Error in background processing')
      
      // Still try to save partial results
      if (!submission.gradingResult) {
        const gradingResult = await gradeSubmission(submission).catch(() => null)
        if (gradingResult) {
          await databaseService.updateSubmission(submissionId, {
            gradingResult,
            gradedAt: new Date()
          })
        }
      }
      
      return NextResponse.json(
        { error: 'Partial processing completed', partial: true },
        { status: 207 } // Multi-status
      )
    }

  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error in background grading')
    return NextResponse.json(
      { error: 'Background grading failed' },
      { status: 500 }
    )
  }
}

// Function to generate improvements for a submission
async function generateImprovements(submission: any) {
  try {
    logger.info({ submissionId: submission.id }, 'Starting improvements generation')
    
    // Generate prompt improvement
    let promptImprovement = null
    try {
      promptImprovement = await generateImprovedPrompt(submission.prompt)
      logger.info({ hasPromptImprovement: !!promptImprovement }, 'Prompt improvement generated')
    } catch (promptError) {
      logger.error(promptError instanceof Error ? promptError.message : String(promptError), 'Error generating prompt improvement')
      promptImprovement = getMockPromptImprovement(submission.prompt)
    }

    // Generate criteria improvements
    let criteriaImprovements = null
    try {
      const activeCriteria = submission.criteria.filter((c: any) => c.status === 'active' || c.status === 'edited')
      criteriaImprovements = await generateImprovedCriteria(activeCriteria, submission.prompt)
      logger.info({ hasCriteriaImprovements: !!criteriaImprovements }, 'Criteria improvements generated')
    } catch (criteriaError) {
      logger.error(criteriaError instanceof Error ? criteriaError.message : String(criteriaError), 'Error generating criteria improvements')
      criteriaImprovements = getMockCriteriaImprovements(submission.criteria)
    }

    return {
      promptImprovement,
      criteriaImprovements,
      generatedAt: new Date()
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error generating improvements')
    return null
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
  // Analyze all criteria and pick the weakest ones
  const weakCriteria = criteria
    .map((c: any) => {
      const text = (c.finalText || c.text).toLowerCase()
      let weaknessScore = 0
      
      // Check for vague terms
      if (text.includes('good') || text.includes('adequate') || text.includes('appropriate')) {
        weaknessScore += 3
      }
      
      // Check for lack of specificity
      if (!text.includes('at least') && !text.includes('must') && !text.includes('should')) {
        weaknessScore += 2
      }
      
      // Check for lack of measurements
      if (!/\d/.test(text)) {
        weaknessScore += 2
      }
      
      // Check if too short (likely vague)
      if (text.length < 30) {
        weaknessScore += 3
      }
      
      return {
        ...c,
        weaknessScore
      }
    })
    .sort((a, b) => b.weaknessScore - a.weaknessScore)
    .slice(0, 5) // Take top 5 weakest
  
  return {
    taskContext: {
      domain: "Literature analysis and character development",
      keyObjectives: ["Analyze character transformation", "Evaluate narrative development", "Assess thematic understanding"],
      specificSkillsAssessed: ["Literary analysis", "Character analysis", "Thematic interpretation"]
    },
    improvements: weakCriteria.map((c: any) => ({
      originalId: c.id,
      original: c.finalText || c.text,
      weaknessScore: c.weaknessScore,
      contextualIssues: [
        c.weaknessScore >= 7 ? "Too vague and lacks specific requirements" : "Could be more specific",
        c.weaknessScore >= 5 ? "Missing measurable thresholds" : "Needs clearer evaluation criteria"
      ],
      improved: `${c.finalText || c.text} with specific examples from at least 3 different books/chapters and includes measurable criteria`,
      specificEnhancements: [
        {
          aspect: "Added specific requirements",
          domainRelevance: "Makes the criterion objectively evaluable",
          concreteExample: "Student must cite specific page numbers and quote relevant passages"
        }
      ]
    }))
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
  
  const prompt = `You are an expert at creating rubric criteria. Your task is to analyze ALL the criteria below and identify the WEAKEST ones that most need improvement.

CRITICAL: You must analyze every criterion and select only those with clear issues for improvement!

ORIGINAL EVALUATION PROMPT:
"${originalPrompt}"

ALL CURRENT CRITERIA TO ANALYZE:
${criteria.map((c: any, i: number) => `${i + 1}. [${c.isPositive ? 'Positive' : 'Negative'}] "${c.finalText || c.text}"`).join('\n')}

First, analyze each criterion for these common issues:
1. VAGUENESS - Uses terms like "good", "adequate", "appropriate" without specific thresholds
2. STACKING - Multiple unrelated aspects combined in one criterion
3. MISSING CONTEXT - Doesn't reference specific concepts from the prompt's domain
4. NO MEASURABILITY - Lacks clear, objective pass/fail conditions
5. GENERIC - Could apply to any assignment, not specific to THIS task

Then select 3-5 of the WEAKEST criteria that have the clearest issues.

For each weak criterion you select, provide:
1. The specific issues that make it weak
2. A concrete improved version with domain-specific details
3. Clear explanation of what was enhanced

DO NOT improve criteria that are already well-written. Focus only on those with genuine issues.

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
      "weaknessScore": 1-10 (10 being weakest),
      "contextualIssues": ["Specific issues with this criterion"],
      "improved": "SPECIFIC improved version with domain-relevant details",
      "specificEnhancements": [
        {
          "aspect": "What was made more specific",
          "domainRelevance": "How it relates to THIS topic",
          "concreteExample": "Example of what would meet this criterion"
        }
      ]
    }
  ]
}`

  try {
    const message = await anthropic.messages.create({
      model: getModelForTask('rubricGeneration'),
      max_tokens: TASK_CONFIGS.rubricGeneration.maxTokens,
      temperature: TASK_CONFIGS.rubricGeneration.temperature,
      system: 'You are an expert in rubric design who analyzes criteria quality and provides targeted improvements for genuinely weak criteria. You understand that not all criteria need improvement - focus only on those with clear issues. Always respond with valid JSON.',
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
    
    // Sort improvements by weakness score and take only the top ones
    if (result.improvements && Array.isArray(result.improvements)) {
      result.improvements.sort((a: any, b: any) => (b.weaknessScore || 0) - (a.weaknessScore || 0))
      result.improvements = result.improvements.slice(0, 5) // Take top 5 weakest
    }
    
    return result
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error generating improved criteria')
    return null
  }
} 