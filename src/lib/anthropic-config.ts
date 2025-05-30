/**
 * Anthropic API configuration
 * Centralizes model selection and API configuration
 */

// Available Claude models
export const CLAUDE_MODELS = {
  'claude-3-opus': 'claude-3-opus-20240229',
  'claude-3-sonnet': 'claude-3-sonnet-20240229',
  'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
  'claude-3-haiku': 'claude-3-haiku-20240307',
} as const

export type ClaudeModelKey = keyof typeof CLAUDE_MODELS
export type ClaudeModelId = typeof CLAUDE_MODELS[ClaudeModelKey]

/**
 * Get the default Claude model to use
 * Checks environment variable first, falls back to Claude 3.5 Sonnet
 */
export function getDefaultModel(): ClaudeModelId {
  const envModel = process.env.DEFAULT_MODEL || process.env.ANTHROPIC_DEFAULT_MODEL
  
  if (envModel) {
    // If it's a direct model ID (starts with claude-)
    if (envModel.startsWith('claude-')) {
      return envModel as ClaudeModelId
    }
    
    // If it's a key from our CLAUDE_MODELS object
    if (envModel in CLAUDE_MODELS) {
      return CLAUDE_MODELS[envModel as ClaudeModelKey]
    }
  }
  
  // Default to Claude 3.5 Sonnet for best balance of performance and cost
  return CLAUDE_MODELS['claude-3.5-sonnet']
}

/**
 * Configuration for different types of tasks
 */
export const TASK_CONFIGS = {
  rubricGeneration: {
    model: getDefaultModel(),
    maxTokens: 4000,
    temperature: 0.7,
  },
  rubricGrading: {
    model: getDefaultModel(),
    maxTokens: 2000,
    temperature: 0.3,
  },
  promptGrading: {
    model: getDefaultModel(),
    maxTokens: 2000,
    temperature: 0.3,
  },
} as const

/**
 * Get model for a specific task type
 */
export function getModelForTask(taskType: keyof typeof TASK_CONFIGS): ClaudeModelId {
  return TASK_CONFIGS[taskType].model
} 