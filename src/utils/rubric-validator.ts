export interface RubricValidationIssue {
  type: 'stacked' | 'non_self_contained' | 'overlapping' | 'vague' | 'too_similar'
  severity: 'error' | 'warning'
  criterionId: string
  message: string
  suggestion?: string
}

export interface RubricMetrics {
  totalCriteria: number
  positiveCriteria: number
  negativeCriteria: number
  objectiveCriteria: number
  subjectiveCriteria: number
  categoriesUsed: Set<string>
  estimatedDifficulty: 'too_easy' | 'appropriate' | 'too_hard'
  diversityScore: number
}

export function validateRubric(rubricItems: any[]): {
  issues: RubricValidationIssue[]
  metrics: RubricMetrics
  isValid: boolean
} {
  const issues: RubricValidationIssue[] = []
  
  // Check each criterion
  rubricItems.forEach((item, index) => {
    // Check for stacked criteria (containing "and")
    if (hasStackedCriteria(item.criterion)) {
      issues.push({
        type: 'stacked',
        severity: 'error',
        criterionId: item.id,
        message: 'Criterion evaluates multiple aspects. Each criterion should test exactly one thing.',
        suggestion: 'Split this into separate criteria, one for each aspect being evaluated.'
      })
    }
    
    // Check for self-contained criteria
    if (!isSelfContained(item.criterion)) {
      issues.push({
        type: 'non_self_contained',
        severity: 'warning',
        criterionId: item.id,
        message: 'Criterion requires external knowledge to evaluate.',
        suggestion: 'Include specific values, names, or facts within the criterion itself.'
      })
    }
    
    // Check for vague criteria
    if (isVague(item.criterion)) {
      issues.push({
        type: 'vague',
        severity: 'warning',
        criterionId: item.id,
        message: 'Criterion is too vague or subjective.',
        suggestion: 'Make it more specific with concrete values or clear boundaries.'
      })
    }
    
    // Check for overlapping criteria
    for (let j = index + 1; j < rubricItems.length; j++) {
      if (areOverlapping(item.criterion, rubricItems[j].criterion)) {
        issues.push({
          type: 'overlapping',
          severity: 'error',
          criterionId: item.id,
          message: `Overlaps with criterion: "${rubricItems[j].criterion}"`,
          suggestion: 'Ensure each aspect is evaluated only once to follow MECE principles.'
        })
      }
    }
  })
  
  // Calculate metrics
  const metrics = calculateMetrics(rubricItems)
  
  // Add issues based on metrics
  if (metrics.totalCriteria < 10) {
    issues.push({
      type: 'vague',
      severity: 'warning',
      criterionId: 'general',
      message: `Only ${metrics.totalCriteria} criteria. Consider adding more for comprehensive evaluation.`
    })
  } else if (metrics.totalCriteria > 30) {
    issues.push({
      type: 'vague',
      severity: 'warning',
      criterionId: 'general',
      message: `${metrics.totalCriteria} criteria may be excessive. Consider if all are necessary.`
    })
  }
  
  if (metrics.diversityScore < 0.3) {
    issues.push({
      type: 'too_similar',
      severity: 'warning',
      criterionId: 'general',
      message: 'Criteria lack diversity. Include varied types of evaluation beyond just "mentions X".'
    })
  }
  
  const positiveRatio = metrics.positiveCriteria / metrics.totalCriteria
  if (positiveRatio > 0.8 || positiveRatio < 0.2) {
    issues.push({
      type: 'vague',
      severity: 'warning',
      criterionId: 'general',
      message: `Imbalanced criteria: ${metrics.positiveCriteria} positive, ${metrics.negativeCriteria} negative. Aim for 40-60% each.`
    })
  }
  
  return {
    issues,
    metrics,
    isValid: issues.filter(i => i.severity === 'error').length === 0
  }
}

function hasStackedCriteria(criterion: string): boolean {
  // Common patterns indicating stacked criteria
  const stackedPatterns = [
    / and (?:also |then )?/i,
    / as well as /i,
    / in addition to /i,
    / along with /i,
    / plus /i,
    / furthermore /i,
    / moreover /i,
    /; .+ (should|must|needs|includes|mentions)/i,
    /, (?:and|while) /i
  ]
  
  // Exceptions where "and" is part of a single concept
  const exceptions = [
    /pros and cons/i,
    /cause and effect/i,
    /compare and contrast/i,
    /black and white/i,
    /back and forth/i,
    /up and down/i,
    /research and development/i,
    /terms and conditions/i
  ]
  
  // Check if any exception applies
  if (exceptions.some(pattern => pattern.test(criterion))) {
    return false
  }
  
  // Check for stacked patterns
  return stackedPatterns.some(pattern => pattern.test(criterion))
}

function isSelfContained(criterion: string): boolean {
  // Patterns that indicate missing specific information
  const vaguePatterns = [
    /mentions the .+ (of|for|in) .+(?!is|are|was|were|equals|contains)/i,
    /includes (a|an|the|some) .+(?! (of|that|which))/i,
    /provides .+(?! (of|that|specifically|exactly))/i,
    /states the .+(?!is|are|was|were)/i,
    /identifies .+(?!as|is)/i,
    /lists? .+(?!including|such as|specifically)/i,
    /describes? .+(?!as|including|with)/i
  ]
  
  // If it matches vague patterns and doesn't contain specific values, it's not self-contained
  const hasVaguePattern = vaguePatterns.some(pattern => pattern.test(criterion))
  const hasSpecificValue = /(?:is|are|was|were|equals|contains|specifically|exactly) .+/i.test(criterion)
  
  return !hasVaguePattern || hasSpecificValue
}

function isVague(criterion: string): boolean {
  const vagueWords = [
    /\bappropriate(ly)?\b/i,
    /\bproper(ly)?\b/i,
    /\badequate(ly)?\b/i,
    /\bsufficient(ly)?\b/i,
    /\brelevant\b/i,
    /\baccurate(ly)?\b/i,
    /\bclear(ly)?\b/i,
    /\bgood\b/i,
    /\bwell\b/i,
    /\beffective(ly)?\b/i,
    /\bcomprehensive(ly)?\b/i,
    /\bthorough(ly)?\b/i,
    /\bdetailed\b/i,
    /\bcorrect(ly)?\b/i,
    /\bsuitable\b/i,
    /\bquality\b/i
  ]
  
  // Check if contains vague words without specific qualifiers
  return vagueWords.some(pattern => pattern.test(criterion)) && 
         !/(?:at least|exactly|minimum|maximum|between|more than|less than|no more than|no less than) \d+/i.test(criterion)
}

function areOverlapping(criterion1: string, criterion2: string): boolean {
  // Normalize criteria for comparison
  const norm1 = criterion1.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const norm2 = criterion2.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  
  // Extract key concepts
  const concepts1 = extractKeyConcepts(norm1)
  const concepts2 = extractKeyConcepts(norm2)
  
  // Check for significant overlap
  const commonConcepts = concepts1.filter(c => concepts2.includes(c))
  const overlapRatio = commonConcepts.length / Math.min(concepts1.length, concepts2.length)
  
  return overlapRatio > 0.7
}

function extractKeyConcepts(text: string): string[] {
  // Remove common words and extract meaningful concepts
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'response',
    'mentions', 'includes', 'contains', 'provides', 'states', 'lists'
  ])
  
  return text.split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
}

function calculateMetrics(rubricItems: any[]): RubricMetrics {
  const totalCriteria = rubricItems.length
  const positiveCriteria = rubricItems.filter(item => item.isPositive).length
  const negativeCriteria = totalCriteria - positiveCriteria
  
  // Estimate objective vs subjective
  const objectiveCriteria = rubricItems.filter(item => 
    item.type === 'objective' || isLikelyObjective(item.criterion)
  ).length
  const subjectiveCriteria = totalCriteria - objectiveCriteria
  
  // Get categories
  const categoriesUsed = new Set(rubricItems.map(item => item.category || 'uncategorized'))
  
  // Calculate diversity score
  const diversityScore = calculateDiversityScore(rubricItems)
  
  // Estimate difficulty
  let estimatedDifficulty: 'too_easy' | 'appropriate' | 'too_hard'
  if (totalCriteria < 10 || diversityScore < 0.3) {
    estimatedDifficulty = 'too_easy'
  } else if (totalCriteria > 25 && negativeCriteria > totalCriteria * 0.6) {
    estimatedDifficulty = 'too_hard'
  } else {
    estimatedDifficulty = 'appropriate'
  }
  
  return {
    totalCriteria,
    positiveCriteria,
    negativeCriteria,
    objectiveCriteria,
    subjectiveCriteria,
    categoriesUsed,
    estimatedDifficulty,
    diversityScore
  }
}

function isLikelyObjective(criterion: string): boolean {
  // Patterns that indicate objective criteria
  const objectivePatterns = [
    /\b(exactly|precisely|specifically)\b/i,
    /\b\d+\b/, // Contains numbers
    /\b(true|false|yes|no)\b/i,
    /\b(is|are|was|were|equals|contains) .+/i,
    /\b(first|second|third|last)\b/i,
    /\b(before|after|between|within)\b/i,
    /\b(format|structure|order|sequence)\b/i
  ]
  
  return objectivePatterns.some(pattern => pattern.test(criterion))
}

function calculateDiversityScore(rubricItems: any[]): number {
  // Check for variety in criterion patterns
  const patterns = rubricItems.map(item => {
    const criterion = item.criterion.toLowerCase()
    if (criterion.includes('mentions')) return 'mentions'
    if (criterion.includes('includes')) return 'includes'
    if (criterion.includes('provides')) return 'provides'
    if (criterion.includes('explains')) return 'explains'
    if (criterion.includes('format')) return 'format'
    if (criterion.includes('structure')) return 'structure'
    if (criterion.includes('avoid')) return 'avoid'
    if (criterion.includes('not')) return 'negative'
    return 'other'
  })
  
  const uniquePatterns = new Set(patterns).size
  const diversityScore = uniquePatterns / Math.max(5, patterns.length * 0.5)
  
  return Math.min(1, diversityScore)
} 