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
        "criterion": "The response addresses the main requirements of the task",
        "isPositive": true
      },
      {
        "id": "mock-2", 
        "criterion": "The response provides specific examples or details",
        "isPositive": true
      },
      {
        "id": "mock-3",
        "criterion": "The response is well-structured and organized",
        "isPositive": true
      },
      {
        "id": "mock-4",
        "criterion": "The response uses appropriate tone and language",
        "isPositive": true
      },
      {
        "id": "mock-5",
        "criterion": "The response is complete and comprehensive",
        "isPositive": true
      },
      {
        "id": "mock-6",
        "criterion": "The response contains factual errors",
        "isPositive": false
      },
      {
        "id": "mock-7",
        "criterion": "The response is too vague or generic",
        "isPositive": false
      },
      {
        "id": "mock-8",
        "criterion": "The response ignores key aspects of the prompt",
        "isPositive": false
      },
      {
        "id": "mock-9",
        "criterion": "The response includes irrelevant information",
        "isPositive": false
      },
      {
        "id": "mock-10",
        "criterion": "The response demonstrates understanding of the task",
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

    // Check if we're in local development mode (placeholder API key)
    if (process.env.ANTHROPIC_API_KEY === 'local-development-placeholder') {
      logger.info({ email: normalizedEmail }, 'Using mock rubric for local development')
      const mockRubric = createMockRubric(prompt)
      return NextResponse.json(mockRubric)
    }

    const systemPrompt = `You are an expert at creating evaluation rubrics for AI-generated content. Your task is to generate a comprehensive rubric with binary (yes/no) criteria that can be used to evaluate whether an AI successfully completes the given task.

Generate between 20-40 specific, measurable criteria. Each criterion should be:
1. Binary (can be answered with yes/no)
2. Specific and unambiguous
3. Directly related to the task requirements
4. Measurable and objective

Include both positive criteria (things the response should include) and negative criteria (things to avoid or common mistakes).

For tasks involving specific data or examples, create criteria that check for:
- Exact values, numbers, or specific information mentioned
- Proper formatting or structure requirements
- Specific examples or cases that should be addressed
- Common errors or misconceptions to avoid

Return the rubric as a JSON array with this structure:
{
  "rubricItems": [
    {
      "id": "unique-id",
      "criterion": "The specific criterion text",
      "isPositive": true/false
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
          content: `Create a comprehensive evaluation rubric for the following task:\n\n${prompt}\n\nGenerate 20-40 specific binary criteria that can be used to evaluate if an AI successfully completes this task.`
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
    
    // Ensure each item has a unique ID
    rubricData.rubricItems = rubricData.rubricItems.map((item: any, index: number) => ({
      ...item,
      id: item.id || `item-${Date.now()}-${index}`,
      isPositive: item.isPositive !== false // Default to positive if not specified
    }))

    // Log the count
    const itemCount = rubricData.rubricItems.length
    if (itemCount < 20 || itemCount > 40) {
      logger.warn({ count: itemCount }, 'Rubric items count out of range')
    }

    logger.info({ email: normalizedEmail, fullName, itemCount }, 'Rubric generated successfully for user')

    return NextResponse.json(rubricData)
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