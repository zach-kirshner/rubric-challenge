# Rubric Best Practices Implementation

This document outlines how the rubric builder implements industry best practices for creating evaluation rubrics.

## Core Principles

### 1. MECE (Mutually Exclusive, Collectively Exhaustive)
- **Completeness**: The system generates 10-30 criteria to comprehensively cover all aspects
- **No Overlapping**: Validation checks prevent criteria that evaluate the same aspect multiple times

### 2. Diversity
- The generator creates varied types of criteria across multiple categories:
  - instruction_following
  - truthfulness
  - reasoning
  - presentation
  - formatting
- Validation warns if diversity score is too low (<30%)

### 3. Atomicity
- Each criterion evaluates exactly ONE distinct aspect
- System detects and flags stacked criteria containing "and"
- Example violations are caught:
  - ❌ "Response identifies George Washington as first president and mentions he served two terms"
  - ✅ Split into two separate criteria

### 4. Specificity
- All criteria are binary (true/false) and objective
- Vague words like "appropriate", "proper", "adequate" are flagged
- Specific values and thresholds are required

### 5. Self-Contained
- Each criterion must contain all information needed to evaluate
- Examples:
  - ❌ "Mentions the capital city of Canada"
  - ✅ "Mentions the capital city of Canada is Ottawa"
- Validation checks for missing specific values/facts

### 6. Optimal Quantity & Balance
- Target: 10-30 criteria (system warns outside this range)
- Balance: 40-60% positive criteria recommended
- Difficulty: Aim for ~50% failure rate on typical responses

## Implementation Details

### Rubric Generator (`/api/rubric/generate`)
- Uses Claude to generate rubrics following all best practices
- Automatically categorizes criteria by type and source
- Validates output for quality metrics

### Rubric Validator (`/utils/rubric-validator`)
- Real-time validation of rubrics against best practices
- Detects:
  - Stacked criteria (multiple aspects)
  - Non-self-contained criteria
  - Overlapping criteria
  - Vague/subjective criteria
  - Poor diversity
- Provides specific suggestions for fixing issues

### Rubric Grader (`/api/admin/grade-rubric`)
- Evaluates user modifications against best practices
- Scoring breakdown:
  - Best practices adherence (30%)
  - Justification quality (25%)
  - Coverage & balance (20%)
  - Measurability & objectivity (15%)
  - Strategic improvements (10%)
- Penalizes violations of MECE principles

### UI Components
- `RubricValidationWarnings`: Real-time feedback on rubric quality
- Shows errors and warnings with specific fix suggestions
- Displays metrics (balance, diversity, difficulty)
- Includes best practices reference guide

## Validation Rules

### Error-Level Issues (Must Fix)
1. **Stacked Criteria**: Contains "and" or evaluates multiple aspects
2. **Overlapping Criteria**: >70% concept overlap with another criterion

### Warning-Level Issues (Should Fix)
1. **Non-Self-Contained**: Missing specific values/facts needed for evaluation
2. **Too Vague**: Contains subjective words without specific thresholds
3. **Poor Balance**: <20% or >80% positive criteria
4. **Low Diversity**: <30% diversity score across criterion types
5. **Wrong Quantity**: <10 or >30 criteria

## Best Practices Reference

When creating or editing rubrics:

1. **Make each criterion atomic** - test exactly one thing
2. **Include specific values** - "mentions Ottawa as capital" not "mentions capital"
3. **Ensure MECE compliance** - no gaps, no overlaps
4. **Balance positive/negative** - aim for 40-60% each
5. **Diversify criterion types** - not just "mentions X" patterns
6. **Target appropriate difficulty** - ~50% failure rate
7. **Keep it objective** - minimize subjective judgment
8. **Stay within 10-30 criteria** - comprehensive but focused

## Grading Rubric Quality

High-quality rubrics (85-100 score) demonstrate:
- Mastery of MECE principles
- All criteria properly atomic and self-contained
- Excellent diversity across evaluation dimensions
- Strong justifications for any modifications
- Appropriate balance and difficulty

Poor rubrics (<50 score) typically have:
- Multiple stacked or overlapping criteria
- Vague criteria lacking specifics
- Poor diversity (all same pattern)
- Missing or weak justifications
- Fundamental misunderstanding of best practices 