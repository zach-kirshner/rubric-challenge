import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import logger from '@/lib/logger'

// In-memory storage for email-name pairs (in production, use database)
const userRegistry: Map<string, string> = new Map()

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Mock rubric for local development
const createMockRubric = (prompt: string) => {
  return {
    "rubricItems": [
      {
        "id": "mock-1",
        "criterion": "The response addresses all main requirements specified in the task",
        "isPositive": true
      },
      {
        "id": "mock-2", 
        "criterion": "The response provides at least three specific examples or supporting details",
        "isPositive": true
      },
      {
        "id": "mock-3",
        "criterion": "The response demonstrates a clear and logical structure with proper organization",
        "isPositive": true
      },
      {
        "id": "mock-4",
        "criterion": "The response maintains an appropriate tone and uses professional language throughout",
        "isPositive": true
      },
      {
        "id": "mock-5",
        "criterion": "The response includes all necessary components for a complete answer",
        "isPositive": true
      },
      {
        "id": "mock-6",
        "criterion": "The response contains factual errors or inaccurate information",
        "isPositive": false
      },
      {
        "id": "mock-7",
        "criterion": "The response lacks specific details and remains too vague or generic",
        "isPositive": false
      },
      {
        "id": "mock-8",
        "criterion": "The response fails to address one or more key aspects explicitly mentioned in the prompt",
        "isPositive": false
      },
      {
        "id": "mock-9",
        "criterion": "The response includes information that is not relevant to the task requirements",
        "isPositive": false
      },
      {
        "id": "mock-10",
        "criterion": "The response clearly demonstrates understanding of the task's core objectives",
        "isPositive": true
      }
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, email, fullName } = body

    if (!prompt || !email || !fullName) {
      return NextResponse.json(
        { error: 'Prompt, email, and full name are required' },
        { status: 400 }
      )
    }

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase()
    
    // Extract first name from full name
    const firstName = fullName.trim().split(/\s+/)[0]
    
    // Check if email exists in registry
    const registeredName = userRegistry.get(normalizedEmail)
    if (registeredName) {
      // Email exists, verify the first name matches
      const registeredFirstName = registeredName.split(/\s+/)[0]
      if (registeredFirstName.toLowerCase() !== firstName.toLowerCase()) {
        logger.warn({ 
          email: normalizedEmail, 
          providedName: firstName, 
          registeredName: registeredFirstName 
        }, 'Name mismatch for existing email')
        
        return NextResponse.json(
          { error: 'The name provided does not match our records for this email address. Please use the same name you used previously.' },
          { status: 403 }
        )
      }
    } else {
      // New email, register it
      userRegistry.set(normalizedEmail, fullName)
      logger.info({ email: normalizedEmail, fullName }, 'New user registered')
    }

    logger.info({ email: normalizedEmail, fullName, promptLength: prompt.length }, 'Generating rubric for user')

    // Check if API key is present and valid
    const apiKey = process.env.ANTHROPIC_API_KEY
    const isValidApiKey = apiKey && apiKey.startsWith('sk-ant-') && apiKey.length > 20
    
    // Use mock rubric if no valid API key or in local development
    if (!isValidApiKey || apiKey === 'local-development-placeholder') {
      logger.info({ 
        email: normalizedEmail, 
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        reason: !apiKey ? 'missing' : apiKey === 'local-development-placeholder' ? 'placeholder' : 'invalid'
      }, 'Using mock rubric - Anthropic API key not configured')
      
      const mockRubric = createMockRubric(prompt)
      return NextResponse.json({
        ...mockRubric,
        _mock: true, // Flag to indicate this is mock data
        _message: "Using mock rubric. To use AI-generated rubrics, configure your Anthropic API key."
      })
    }

    try {
      const systemPrompt = `You are an expert at creating evaluation rubrics for AI-generated content. Your task is to generate a comprehensive rubric with binary (yes/no) criteria following these best practices:

CRITICAL PRINCIPLES:
1. MECE (Mutually Exclusive, Collectively Exhaustive)
   - Completeness: Include ALL elements needed for a perfect response
   - No overlapping: The same error shouldn't be punished multiple times
   
2. DIVERSITY
   - Include varied types of criteria, not just "mentions X" style items
   - Balance different evaluation dimensions

3. ATOMICITY
   - Each criterion evaluates EXACTLY ONE distinct aspect
   - NO stacked criteria with "and" - break them into separate items
   - ❌ "Response identifies George Washington as first president and mentions he served two terms"
   - ✅ Two separate criteria for each fact

4. SPECIFICITY
   - Binary (true/false) and objective
   - Avoid vague descriptions
   - Define precisely what is expected
   - Example: "The response lists exactly three examples" not "provides examples"

5. SELF-CONTAINED
   - Each criterion contains ALL information needed to evaluate
   - ❌ "Mentions the capital city of Canada"
   - ✅ "Mentions the capital city of Canada is Ottawa"
   - Include specific values, names, or facts within the criterion

6. VERIFIABLE
   - Criteria should be verifiable without external search
   - Include the correct information in the criterion itself

7. FORMAT AS STATEMENTS, NOT QUESTIONS
   - Each criterion must be a declarative statement, NOT a question
   - Use clear statement formats like:
     - "The response states that..."
     - "The response mentions..."
     - "The response explains..."
     - "The response clarifies..."
     - "The response identifies..."
     - "The response provides..."
     - "The model recommends..."
     - "When describing [X], the response conveys..."
   - ❌ "Does the response mention Paris as the capital of France?"
   - ✅ "The response mentions Paris as the capital of France"
   - ❌ "Is the calculation correct?"
   - ✅ "The response calculates the total as exactly $156.78"

TARGET METRICS:
- Generate 10-30 criteria (as many as needed for comprehensive coverage)
- Aim for criteria where a typical model might fail ~50% of them
- Include both positive criteria (what should be present) and negative criteria (what to avoid)

CATEGORIZE each criterion by:
- Type: objective (measurable fact) vs subjective (requires judgment)
- Source: explicit (directly stated in prompt) vs implicit (inferred from expectations)
- Category: instruction_following, truthfulness, reasoning, presentation, or formatting

For tasks involving specific data, create criteria that check for:
- Exact values, numbers, or specific information
- Proper formatting or structure requirements
- Specific examples or cases that should be addressed
- Common errors or misconceptions to avoid

EXAMPLES OF WELL-FORMATTED CRITERIA:
- "The response states that the Swatch Group's net sales figure for FY 2019 is CHF 8243 million"
- "The model recommends Chamaedorea Elegans (Parlor Palm) as a suitable plant for the friend"
- "The response mentions Zefyras boutique as one that fits all the criteria mentioned in the task"
- "The response explains that the total THC in a gummy cannot exceed 10% of the total cannabinoids"
- "When describing Zefyras' sustainability practices, the response conveys that some designs are made with upcycled denim"

Return the rubric as JSON:
{
  "rubricItems": [
    {
      "id": "unique-id",
      "criterion": "The specific criterion text (self-contained with all needed info, formatted as a statement)",
      "isPositive": true/false,
      "type": "objective|subjective",
      "source": "explicit|implicit", 
      "category": "instruction_following|truthfulness|reasoning|presentation|formatting"
    }
  ]
}`

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Create a comprehensive evaluation rubric for the following task:\n\n${prompt}\n\nGenerate 10-30 specific binary criteria that can be used to evaluate if an AI successfully completes this task.`
          }
        ]
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // Parse the response
      const responseText = content.text
      const jsonMatch = responseText.match(/\{[\s\S]*"rubricItems"[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Could not parse rubric from response')
      }

      const rubricData = JSON.parse(jsonMatch[0])
      
      // Validate and enhance rubric items
      rubricData.rubricItems = rubricData.rubricItems.map((item: any, index: number) => ({
        ...item,
        id: item.id || `item-${Date.now()}-${index}`,
        isPositive: item.isPositive !== false, // Default to positive if not specified
        type: item.type || 'objective', // Default to objective
        source: item.source || 'explicit', // Default to explicit
        category: item.category || 'instruction_following' // Default category
      }))

      // Validate rubric quality
      const itemCount = rubricData.rubricItems.length
      if (itemCount < 10) {
        logger.warn({ count: itemCount }, 'Rubric has fewer than 10 items - task may be too simple')
      } else if (itemCount > 30) {
        logger.warn({ count: itemCount }, 'Rubric has more than 30 items - consider if all are necessary')
      }

      // Check for diversity
      const categories = new Set(rubricData.rubricItems.map((item: any) => item.category))
      if (categories.size < 2) {
        logger.warn({ categories: Array.from(categories) }, 'Rubric lacks diversity - only uses limited categories')
      }

      // Check for balance of positive/negative
      const positiveCount = rubricData.rubricItems.filter((item: any) => item.isPositive).length
      const negativeCount = itemCount - positiveCount
      const ratio = positiveCount / itemCount
      if (ratio > 0.8 || ratio < 0.2) {
        logger.warn({ positiveCount, negativeCount, ratio }, 'Rubric lacks balance between positive and negative criteria')
      }

      logger.info({ email: normalizedEmail, fullName, itemCount }, 'Rubric generated successfully for user')

      return NextResponse.json(rubricData)
    } catch (anthropicError: any) {
      // Handle Anthropic API errors specifically
      logger.error({ 
        error: anthropicError?.message || 'Unknown Anthropic error',
        status: anthropicError?.status,
        type: anthropicError?.error?.type 
      }, 'Anthropic API error')
      
      // Fall back to mock rubric on API error
      logger.info({ email: normalizedEmail }, 'Falling back to mock rubric due to API error')
      const mockRubric = createMockRubric(prompt)
      return NextResponse.json({
        ...mockRubric,
        _mock: true,
        _message: "Using mock rubric due to API error. This may be a temporary issue."
      })
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error), 'Error generating rubric')
    return NextResponse.json(
      { error: 'Failed to generate rubric' },
      { status: 500 }
    )
  }
}

// Export for use in other APIs
export { userRegistry } 