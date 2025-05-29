import React from 'react'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { RubricValidationIssue, RubricMetrics } from '@/utils/rubric-validator'

interface RubricValidationWarningsProps {
  issues: RubricValidationIssue[]
  metrics: RubricMetrics
  onFixIssue?: (criterionId: string, issue: RubricValidationIssue) => void
}

export function RubricValidationWarnings({ 
  issues, 
  metrics,
  onFixIssue 
}: RubricValidationWarningsProps) {
  if (issues.length === 0) {
    return (
      <div style={{
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #86efac',
        backgroundColor: '#f0fdf4',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <Info style={{ width: '1rem', height: '1rem', color: '#16a34a', flexShrink: 0 }} />
          <div>
            <h3 style={{ fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>Great job!</h3>
            <p style={{ fontSize: '0.875rem', color: '#15803d' }}>
              Your rubric follows all best practices. It has {metrics.totalCriteria} well-formed criteria
              with good balance ({metrics.positiveCriteria} positive, {metrics.negativeCriteria} negative).
            </p>
          </div>
        </div>
      </div>
    )
  }

  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Summary Alert */}
      <div style={{
        padding: '1rem',
        borderRadius: '0.5rem',
        border: `1px solid ${errors.length > 0 ? '#fecaca' : '#fde68a'}`,
        backgroundColor: errors.length > 0 ? '#fef2f2' : '#fef3c7',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          {errors.length > 0 ? (
            <AlertCircle style={{ width: '1rem', height: '1rem', color: '#dc2626', flexShrink: 0 }} />
          ) : (
            <AlertTriangle style={{ width: '1rem', height: '1rem', color: '#d97706', flexShrink: 0 }} />
          )}
          <div>
            <h3 style={{ 
              fontWeight: 600, 
              color: errors.length > 0 ? '#991b1b' : '#92400e',
              marginBottom: '0.25rem' 
            }}>
              Rubric Quality Check
            </h3>
            <p style={{ 
              fontSize: '0.875rem', 
              color: errors.length > 0 ? '#b91c1c' : '#b45309' 
            }}>
              Found {errors.length} error{errors.length !== 1 ? 's' : ''} and {warnings.length} warning{warnings.length !== 1 ? 's' : ''} based on best practices.
              {metrics.diversityScore < 0.3 && " Consider adding more diverse criteria types."}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Summary */}
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        padding: '1rem',
        fontSize: '0.875rem'
      }}>
        <h4 style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Rubric Metrics</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '0.5rem',
          color: '#4b5563'
        }}>
          <div>Total Criteria: {metrics.totalCriteria}</div>
          <div>Categories: {Array.from(metrics.categoriesUsed).join(', ')}</div>
          <div>Balance: {Math.round((metrics.positiveCriteria / metrics.totalCriteria) * 100)}% positive</div>
          <div>Difficulty: {metrics.estimatedDifficulty.replace('_', ' ')}</div>
        </div>
      </div>

      {/* Individual Issues */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {issues.map((issue, index) => (
          <IssueCard 
            key={`${issue.criterionId}-${index}`} 
            issue={issue} 
            onFix={onFixIssue ? () => onFixIssue(issue.criterionId, issue) : undefined}
          />
        ))}
      </div>

      {/* Best Practices Reference */}
      <details style={{
        backgroundColor: '#dbeafe',
        borderRadius: '0.5rem',
        padding: '1rem'
      }}>
        <summary style={{ 
          cursor: 'pointer', 
          fontWeight: 500, 
          color: '#1e3a8a',
          marginBottom: '0.75rem'
        }}>
          Best Practices Reference
        </summary>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: '#1e40af'
        }}>
          <div>
            <strong>MECE:</strong> Criteria should be Mutually Exclusive (no overlaps) and Collectively Exhaustive (complete coverage)
          </div>
          <div>
            <strong>Atomicity:</strong> Each criterion should test exactly one thing - avoid "and" statements
          </div>
          <div>
            <strong>Self-Contained:</strong> Include all information needed to evaluate within the criterion itself
          </div>
          <div>
            <strong>Balance:</strong> Aim for 40-60% positive criteria and diverse evaluation types
          </div>
          <div>
            <strong>Quantity:</strong> 10-30 criteria is optimal for most tasks
          </div>
        </div>
      </details>
    </div>
  )
}

function IssueCard({ 
  issue, 
  onFix 
}: { 
  issue: RubricValidationIssue
  onFix?: () => void 
}) {
  const isError = issue.severity === 'error'
  const bgColor = isError ? '#fef2f2' : '#fef3c7'
  const borderColor = isError ? '#fecaca' : '#fde68a'
  const textColor = isError ? '#991b1b' : '#92400e'
  const iconColor = isError ? '#dc2626' : '#d97706'

  const typeLabels: Record<string, string> = {
    stacked: 'Stacked Criteria',
    non_self_contained: 'Missing Information',
    overlapping: 'Overlapping',
    vague: 'Too Vague',
    too_similar: 'Lacks Diversity'
  }

  return (
    <div style={{
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '0.5rem',
      padding: '0.75rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        {isError ? (
          <AlertCircle style={{ width: '1rem', height: '1rem', color: iconColor, marginTop: '0.125rem', flexShrink: 0 }} />
        ) : (
          <AlertTriangle style={{ width: '1rem', height: '1rem', color: iconColor, marginTop: '0.125rem', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, color: textColor, fontSize: '0.875rem' }}>
            {typeLabels[issue.type] || issue.type}
          </div>
          <div style={{ color: textColor, opacity: 0.9, fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {issue.message}
          </div>
          {issue.suggestion && (
            <div style={{ color: '#4b5563', fontSize: '0.875rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
              💡 {issue.suggestion}
            </div>
          )}
        </div>
        {onFix && issue.criterionId !== 'general' && (
          <button
            onClick={onFix}
            style={{
              fontSize: '0.875rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Fix
          </button>
        )}
      </div>
    </div>
  )
} 