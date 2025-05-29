'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, TrendingUp, Edit3, Trash2, Plus, CheckCircle, XCircle, Shield, ChevronRight, Clock, Award, RefreshCw, FileText, Target } from 'lucide-react'
import logger from '@/lib/logger'

interface Submission {
  id: string
  email: string
  fullName: string
  prompt: string
  submittedAt: string
  stats: {
    originalCount: number
    finalCount: number
    deletedCount: number
    editedCount: number
    addedCount: number
  }
  qualityScore: number
  promptScore?: number
  combinedScore?: number
  grade?: string
  promptGrade?: string
  isGraded?: boolean
}

interface EvaluationData {
  submission: {
    id: string
    email: string
    fullName: string
    prompt: string
    submittedAt: string
    stats: any
  }
  criteria: {
    original: any[]
    added: any[]
    edited: any[]
    deleted: any[]
    final: any[]
  }
  actions: any[]
  evaluation: {
    qualityScore: number
    insights: string[]
    gradingResult?: any
    gradedAt?: string
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<EvaluationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check admin access
  useEffect(() => {
    const adminAccess = sessionStorage.getItem('adminAccess')
    if (adminAccess !== 'true') {
      router.push('/prompt')
      return
    }

    fetchSubmissions()
  }, [router])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions')
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      // Calculate combined scores for each submission
      const submissionsWithCombinedScores = (data.submissions || []).map((sub: any) => {
        const promptScore = sub.promptScore || 0
        const rubricScore = sub.qualityScore || 0
        const combinedScore = Math.round((promptScore + rubricScore) / 2)
        
        return {
          ...sub,
          promptScore,
          combinedScore
        }
      })
      
      setSubmissions(submissionsWithCombinedScores)
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error), 'Error fetching submissions')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubmissionDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/submissions?id=${id}`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setSelectedSubmission(data)
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error), 'Error fetching submission details')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#22C55E'
    if (score >= 80) return '#3B82F6'
    if (score >= 70) return '#F59E0B'
    if (score >= 60) return '#F97316'
    return '#EF4444'
  }

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'EXCELLENT': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }
      case 'VERY GOOD': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }
      case 'GOOD': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }
      case 'SATISFACTORY': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }
      case 'NEEDS IMPROVEMENT': return { bg: 'rgba(249, 115, 22, 0.1)', color: '#F97316' }
      case 'UNSATISFACTORY': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }
      default: return { bg: 'rgba(156, 163, 175, 0.1)', color: '#9CA3AF' }
    }
  }

  if (selectedSubmission) {
    const gradingResult = selectedSubmission.evaluation.gradingResult
    const promptScore = gradingResult?.promptGrade?.score || 0
    const rubricScore = gradingResult?.score || selectedSubmission.evaluation.qualityScore
    const combinedScore = Math.round((promptScore + rubricScore) / 2)

    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <header className="sticky top-0 z-40 glass" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="icon-button"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Submission Evaluation</h1>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: getScoreColor(combinedScore) }}>
                    {combinedScore}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Overall Score</div>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-bold" style={{ color: getScoreColor(promptScore) }}>
                      {promptScore}%
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Prompt</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold" style={{ color: getScoreColor(rubricScore) }}>
                      {rubricScore}%
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Rubric</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Submission Info */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-2">Prompt</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {selectedSubmission.submission.prompt}
            </p>
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span style={{ color: 'var(--color-muted-foreground)' }}>User: </span>
                <span className="font-medium">{selectedSubmission.submission.fullName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-muted-foreground)' }}>Submitted: </span>
                <span className="font-medium">
                  {new Date(selectedSubmission.submission.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card text-center">
              <div className="text-2xl font-bold">{selectedSubmission.submission.stats.originalCount}</div>
              <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Original</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">{selectedSubmission.submission.stats.addedCount}</div>
              <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Added</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedSubmission.submission.stats.editedCount}</div>
              <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Edited</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-red-600">{selectedSubmission.submission.stats.deletedCount}</div>
              <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Deleted</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold">{selectedSubmission.submission.stats.finalCount}</div>
              <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Final</div>
            </div>
          </div>

          {/* Grading Results */}
          {gradingResult && (
            <div className="card card-elevated mb-6">
              <h2 className="text-xl font-semibold mb-4">Detailed Grading Results</h2>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Prompt Grade */}
                {gradingResult.promptGrade && (
                  <div className="card" style={{ backgroundColor: 'var(--color-muted)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
                      <h3 className="text-lg font-medium">Prompt Quality Assessment</h3>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div 
                        className="text-5xl font-bold"
                        style={{ color: getScoreColor(gradingResult.promptGrade.score) }}
                      >
                        {gradingResult.promptGrade.score}
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>out of 100</p>
                        <div 
                          className="px-3 py-1 rounded-full text-sm font-medium mt-1"
                          style={getGradeBadgeColor(gradingResult.promptGrade.grade)}
                        >
                          {gradingResult.promptGrade.grade}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      {Object.entries(gradingResult.promptGrade.breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{value as number}/{
                            key === 'realism_and_interest' || key === 'difficulty_and_complexity' || key === 'research_requirements' ? 20 :
                            key === 'synthesis_and_reasoning' || key === 'universality_and_objectivity' ? 15 : 10
                          }</span>
                        </div>
                      ))}
                    </div>

                    {/* Prompt Strengths and Weaknesses */}
                    {gradingResult.promptGrade.strengths && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2">Strengths</p>
                        <ul className="space-y-1">
                          {gradingResult.promptGrade.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#22C55E' }} />
                              <span className="text-xs">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {gradingResult.promptGrade.weaknesses && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2">Weaknesses</p>
                        <ul className="space-y-1">
                          {gradingResult.promptGrade.weaknesses.map((weakness: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
                              <span className="text-xs">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Prompt Penalties */}
                    {gradingResult.promptGrade.penalties_applied && gradingResult.promptGrade.penalties_applied.length > 0 && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <p className="text-sm font-medium mb-2">Penalties</p>
                        <div className="space-y-1">
                          {gradingResult.promptGrade.penalties_applied.map((penalty: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span>{penalty.reason}</span>
                              <span style={{ color: '#EF4444' }}>-{penalty.points_deducted}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Rubric Grade */}
                <div className="card" style={{ backgroundColor: 'var(--color-muted)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
                    <h3 className="text-lg font-medium">Rubric Quality Assessment</h3>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="text-5xl font-bold"
                      style={{ color: getScoreColor(gradingResult.score) }}
                    >
                      {gradingResult.score}
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>out of 100</p>
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-medium mt-1"
                        style={getGradeBadgeColor(gradingResult.grade)}
                      >
                        {gradingResult.grade}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    {Object.entries(gradingResult.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{value as number}/{
                          key === 'relevance_coverage' || key === 'specificity_measurability' ? 25 :
                          key === 'user_improvements' ? 20 :
                          key === 'justification_quality' ? 15 :
                          key === 'structure_organization' ? 10 : 5
                        }</span>
                      </div>
                    ))}
                  </div>

                  {/* Rubric Strengths and Weaknesses */}
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Strengths</p>
                    <ul className="space-y-1">
                      {gradingResult.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#22C55E' }} />
                          <span className="text-xs">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Weaknesses</p>
                    <ul className="space-y-1">
                      {gradingResult.weaknesses.map((weakness: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
                          <span className="text-xs">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rubric Penalties */}
                  {gradingResult.penalties_applied && gradingResult.penalties_applied.length > 0 && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-sm font-medium mb-2">Penalties</p>
                      <div className="space-y-1">
                        {gradingResult.penalties_applied.map((penalty: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span>{penalty.reason}</span>
                            <span style={{ color: '#EF4444' }}>-{penalty.points_deducted}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Combined Summary */}
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-medium mb-3">Overall Assessment</h3>
                <div className="grid grid-cols-2 gap-6">
                  {gradingResult.promptGrade && (
                    <div>
                      <p className="text-sm font-medium mb-2">Prompt Summary</p>
                      <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                        {gradingResult.promptGrade.summary}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-2">Rubric Summary</p>
                    <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                      {gradingResult.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Specific Feedback */}
              {gradingResult.specific_feedback && (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <h3 className="font-medium mb-3">Specific Feedback</h3>
                  <div className="space-y-4">
                    {gradingResult.specific_feedback.worst_change && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                        <p className="text-sm font-medium mb-1" style={{ color: '#EF4444' }}>
                          Worst Change
                        </p>
                        <p className="text-sm mb-1">"{gradingResult.specific_feedback.worst_change.criterion}"</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          Issue: {gradingResult.specific_feedback.worst_change.issue}
                        </p>
                      </div>
                    )}
                    {gradingResult.specific_feedback.best_change && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                        <p className="text-sm font-medium mb-1" style={{ color: '#22C55E' }}>
                          Best Change
                        </p>
                        <p className="text-sm mb-1">"{gradingResult.specific_feedback.best_change.criterion}"</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          Reason: {gradingResult.specific_feedback.best_change.reason}
                        </p>
                      </div>
                    )}
                    {gradingResult.specific_feedback.justification_analysis && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Strong Justifications</p>
                          <ul className="space-y-1">
                            {gradingResult.specific_feedback.justification_analysis.strong_justifications?.map((just: string, idx: number) => (
                              <li key={idx} className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                • {just}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Weak Justifications</p>
                          <ul className="space-y-1">
                            {gradingResult.specific_feedback.justification_analysis.weak_justifications?.map((just: string, idx: number) => (
                              <li key={idx} className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                • {just}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions Timeline */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Actions Timeline</h3>
            <div className="space-y-4">
              {selectedSubmission.actions.map((action, index) => (
                <div key={action.id} className="flex gap-4 pb-4 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex-shrink-0">
                    {action.actionType === 'add' && <Plus className="w-5 h-5 text-green-600" />}
                    {action.actionType === 'edit' && <Edit3 className="w-5 h-5 text-blue-600" />}
                    {action.actionType === 'delete' && <Trash2 className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">
                      {action.actionType === 'add' && 'Added new criterion'}
                      {action.actionType === 'edit' && 'Edited criterion'}
                      {action.actionType === 'delete' && 'Deleted criterion'}
                    </div>
                    {action.previousText && (
                      <div className="text-sm mb-1">
                        <span style={{ color: 'var(--color-muted-foreground)' }}>From: </span>
                        <span className="line-through">{action.previousText}</span>
                      </div>
                    )}
                    {action.newText && (
                      <div className="text-sm mb-1">
                        <span style={{ color: 'var(--color-muted-foreground)' }}>To: </span>
                        <span className="font-medium">{action.newText}</span>
                      </div>
                    )}
                    <div className="text-sm italic" style={{ color: 'var(--color-muted-foreground)' }}>
                      "{action.justification}"
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final Criteria */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Final Criteria ({selectedSubmission.criteria.final.length})</h3>
            <div className="space-y-3">
              {selectedSubmission.criteria.final.map((criterion, index) => (
                <div key={criterion.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{ 
                        background: criterion.isPositive 
                          ? 'linear-gradient(135deg, #10B981, #34D399)' 
                          : 'linear-gradient(135deg, #EF4444, #F87171)',
                        color: 'white'
                      }}
                    >
                      {criterion.isPositive ? '+' : '-'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      {criterion.finalText || criterion.text}
                    </p>
                    <div className="flex gap-4 mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {criterion.source === 'user_added' && (
                        <span className="text-green-600">User Added</span>
                      )}
                      {criterion.status === 'edited' && (
                        <span className="text-blue-600">Edited</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <header className="sticky top-0 z-40 glass" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/prompt')}
                className="icon-button"
                title="Back to home"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Shield className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
                </div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('adminAccess')
                router.push('/prompt')
              }}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4" />
            <p>Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="card text-center py-12">
            <p style={{ color: 'var(--color-muted-foreground)' }}>No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const promptScore = submission.promptScore || 0
              const rubricScore = submission.qualityScore || 0
              const combinedScore = submission.combinedScore || Math.round((promptScore + rubricScore) / 2)
              
              return (
                <div key={submission.id} className="card hover-lift cursor-pointer" onClick={() => fetchSubmissionDetails(submission.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{submission.prompt}</p>
                      <div className="flex gap-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                        <span>User: {submission.fullName}</span>
                        <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: getScoreColor(combinedScore) }}>
                          {combinedScore}%
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Overall</div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium" style={{ color: getScoreColor(promptScore) }}>
                            {promptScore}%
                          </div>
                          <div style={{ color: 'var(--color-muted-foreground)' }}>Prompt</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium" style={{ color: getScoreColor(rubricScore) }}>
                            {rubricScore}%
                          </div>
                          <div style={{ color: 'var(--color-muted-foreground)' }}>Rubric</div>
                        </div>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <div className="chip chip-added">
                          <Plus className="w-3 h-3" />
                          {submission.stats.addedCount}
                        </div>
                        <div className="chip chip-edited">
                          <Edit3 className="w-3 h-3" />
                          {submission.stats.editedCount}
                        </div>
                        <div className="chip chip-removed">
                          <Trash2 className="w-3 h-3" />
                          {submission.stats.deletedCount}
                        </div>
                      </div>
                      <Eye className="w-5 h-5" style={{ color: 'var(--color-muted-foreground)' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
} 