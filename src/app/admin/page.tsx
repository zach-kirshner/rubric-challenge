'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, TrendingUp, Edit3, Trash2, Plus, CheckCircle, XCircle, Shield, ChevronRight, Clock, Award, RefreshCw, FileText, Target, Download, BarChart3, Users, Activity, TrendingDown, Sparkles, Info } from 'lucide-react'
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

interface DashboardData {
  overview: {
    totalUsers: number
    totalSubmissions: number
    averageRubricScore: number
    averagePromptScore: number
    averageCombinedScore: number
    submissionsPerUser: number
  }
  scoreDistribution: {
    rubric: number[]
    prompt: number[]
    combined: number[]
  }
  gradeDistribution: {
    rubric: { [key: string]: number }
    prompt: { [key: string]: number }
    combined: { [key: string]: number }
  }
  userPerformance: any[]
  topPerformers: any[]
  submissionTimeline: { date: string; count: number }[]
}

interface Improvements {
  promptImprovement: {
    domainAnalysis: {
      topic: string
      taskType: string
      currentFocus: string
    }
    improvedPrompt: string
    improvements: Array<{
      criterion: string
      change: string
      reason: string
      pointsGained?: string
    }>
    contextualEnhancements: Array<{
      aspect: string
      enhancement: string
      example: string
    }>
    estimatedScore?: {
      before: string
      after: string
      breakdown: {
        realism_and_interest: number
        difficulty_and_complexity: number
        research_requirements: number
        synthesis_and_reasoning: number
        universality_and_objectivity: number
        scope_and_specificity: number
      }
    }
  }
  criteriaImprovements: {
    taskContext: {
      domain: string
      keyObjectives: string[]
      specificSkillsAssessed: string[]
    }
    improvements: Array<{
      originalId: string
      original: string
      weaknessScore?: number
      contextualIssues: string[]
      improved: string
      specificEnhancements: Array<{
        aspect: string
        domainRelevance: string
        concreteExample: string
      }>
    }>
  }
}

// Add a new Tooltip component
const ImprovementTooltip = ({ 
  children, 
  improvement 
}: { 
  children: React.ReactNode
  improvement?: any 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const tooltipWidth = 500 // increased for more content
    const tooltipHeight = 400 // estimated max height
    
    // Position tooltip to avoid going off-screen horizontally
    let x = rect.left + rect.width / 2
    if (x + tooltipWidth / 2 > viewportWidth) {
      x = viewportWidth - tooltipWidth / 2 - 20
    } else if (x - tooltipWidth / 2 < 0) {
      x = tooltipWidth / 2 + 20
    }
    
    // Position tooltip below if there's not enough space above
    let y = rect.top - 10
    const spaceAbove = rect.top
    const spaceBelow = viewportHeight - rect.bottom
    
    // If not enough space above and more space below, position below the element
    if (spaceAbove < tooltipHeight && spaceBelow > spaceAbove) {
      y = rect.bottom + 10
    }
    
    setPosition({
      x,
      y
    })
    
    // Add delay before showing
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, 500)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const isPromptImprovement = improvement?.improvedPrompt !== undefined
  const isCriteriaImprovement = improvement?.improved !== undefined

  return (
    <div 
      className="relative inline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {improvement && isVisible && (
        <div 
          className={`fixed z-50 p-4 rounded-lg shadow-xl max-w-2xl transition-opacity duration-200 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ 
            left: position.x,
            top: position.y,
            transform: position.y < 500 ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--gradient-mid)' }} />
            <span className="text-sm font-semibold">AI-Suggested Improvement</span>
          </div>
          
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {/* Prompt Improvement Display */}
            {isPromptImprovement && (
              <>
                {/* Domain Analysis */}
                {improvement.domainAnalysis && (
                  <div className="space-y-1 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                      Domain Analysis:
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span style={{ color: 'var(--color-muted-foreground)' }}>Topic: </span>
                        <span className="font-medium">{improvement.domainAnalysis.topic}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-muted-foreground)' }}>Type: </span>
                        <span className="font-medium">{improvement.domainAnalysis.taskType}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-muted-foreground)' }}>Focus: </span>
                        <span className="font-medium">{improvement.domainAnalysis.currentFocus}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Improved Prompt */}
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                    Improved version:
                  </p>
                  <p className="text-sm font-medium leading-relaxed">
                    {improvement.improvedPrompt}
                  </p>
                </div>

                {/* Contextual Enhancements */}
                {improvement.contextualEnhancements && improvement.contextualEnhancements.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                      Specific Enhancements:
                    </p>
                    <div className="space-y-2">
                      {improvement.contextualEnhancements.map((enhancement: any, idx: number) => (
                        <div key={idx} className="pl-3 border-l-2" style={{ borderColor: 'var(--gradient-mid)' }}>
                          <p className="text-xs font-medium">{enhancement.aspect}</p>
                          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                            {enhancement.enhancement}
                          </p>
                          <p className="text-xs italic mt-1">
                            Example: {enhancement.example}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements by Criterion */}
                {improvement.improvements && improvement.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                      Improvements by criterion:
                    </p>
                    <ul className="space-y-1">
                      {improvement.improvements.map((imp: any, idx: number) => (
                        <li key={idx} className="text-xs">
                          <span className="font-medium">{imp.criterion.replace(/_/g, ' ')}: </span>
                          <span>{imp.change}</span>
                          {imp.pointsGained && (
                            <span className="ml-1 font-medium" style={{ color: '#22C55E' }}>
                              (+{imp.pointsGained} pts)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Criteria Improvement Display */}
            {isCriteriaImprovement && (
              <>
                {/* Weakness Score */}
                {improvement.weaknessScore && (
                  <div className="mb-2">
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                      Weakness score: 
                      <span className="ml-1 font-bold" style={{ color: improvement.weaknessScore >= 7 ? '#EF4444' : improvement.weaknessScore >= 5 ? '#F59E0B' : '#3B82F6' }}>
                        {improvement.weaknessScore}/10
                      </span>
                    </p>
                  </div>
                )}
                
                {/* Improved Criterion */}
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                    Improved version:
                  </p>
                  <p className="text-sm font-medium">
                    {improvement.improved}
                  </p>
                </div>

                {/* Contextual Issues */}
                {improvement.contextualIssues && improvement.contextualIssues.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                      Issues addressed:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {improvement.contextualIssues.map((issue: string, idx: number) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specific Enhancements */}
                {improvement.specificEnhancements && improvement.specificEnhancements.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                      Specific improvements:
                    </p>
                    <ul className="space-y-2">
                      {improvement.specificEnhancements.map((enhancement: any, idx: number) => (
                        <li key={idx} className="text-xs">
                          <div className="flex items-start gap-1">
                            <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">{enhancement.aspect}: </span>
                              <span>{enhancement.domainRelevance}</span>
                              {enhancement.concreteExample && (
                                <p className="text-xs italic mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                                  E.g., {enhancement.concreteExample}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            
            {/* Score Improvement (for both types) */}
            {improvement.estimatedScore && (
              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs">
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Score improvement: </span>
                  <span className="font-medium" style={{ color: '#EF4444' }}>
                    {improvement.estimatedScore.before}
                  </span>
                  <span style={{ color: 'var(--color-muted-foreground)' }}> → </span>
                  <span className="font-medium" style={{ color: '#22C55E' }}>
                    {improvement.estimatedScore.after}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<EvaluationData | null>(null)
  const [improvements, setImprovements] = useState<Improvements | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [currentView, setCurrentView] = useState<'submissions' | 'dashboard'>('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Check admin access
  useEffect(() => {
    const adminAccess = sessionStorage.getItem('adminAccess')
    if (adminAccess !== 'true') {
      router.push('/prompt')
      return
    }

    fetchDashboardData()
    fetchSubmissions()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error), 'Error fetching dashboard data')
    }
  }

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
      
      // Extract improvements from gradingResult if available
      if (data.evaluation?.gradingResult?.improvements) {
        setImprovements(data.evaluation.gradingResult.improvements)
      } else {
        setImprovements(null)
      }
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error), 'Error fetching submission details')
    }
  }

  const exportData = async (type: 'users' | 'submissions') => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/admin/export?type=${type}`)
      if (!response.ok) throw new Error('Failed to export')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${type}_export.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error), 'Error exporting data')
    } finally {
      setIsExporting(false)
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

  // Dashboard Components
  const ScoreDistributionChart = ({ scores, title }: { scores: number[], title: string }) => {
    const maxCount = Math.max(...scores)
    return (
      <div className="card">
        <h3 className="text-lg font-medium mb-4">{title} Score Distribution</h3>
        <div className="space-y-2">
          {scores.map((count, index) => {
            const scoreRange = `${index * 10}-${(index + 1) * 10 - 1}`
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 text-sm font-medium">{scoreRange}</div>
                <div className="flex-1 relative">
                  <div 
                    className="h-6 rounded transition-all duration-300"
                    style={{ 
                      background: `linear-gradient(90deg, ${getScoreColor(index * 10 + 5)}, ${getScoreColor(index * 10 + 5)}88)`,
                      width: `${percentage}%`,
                      minWidth: count > 0 ? '8px' : '0'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-start pl-2 text-xs font-medium text-white">
                    {count > 0 && count}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const TimelineChart = ({ timeline }: { timeline: { date: string; count: number }[] }) => {
    const maxCount = Math.max(...timeline.map(t => t.count))
    
    return (
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Submission Timeline</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {timeline.map((point, index) => {
            const percentage = maxCount > 0 ? (point.count / maxCount) * 100 : 0
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-20 text-sm font-medium">{point.date}</div>
                <div className="flex-1 relative">
                  <div 
                    className="h-4 rounded transition-all duration-300"
                    style={{ 
                      background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-mid))',
                      width: `${percentage}%`,
                      minWidth: point.count > 0 ? '4px' : '0'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-start pl-2 text-xs font-medium text-white">
                    {point.count > 0 && point.count}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
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
                  onClick={() => {
                    setSelectedSubmission(null)
                    setImprovements(null)
                  }}
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Prompt</h2>
              {improvements?.promptImprovement && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4" style={{ color: 'var(--gradient-mid)' }} />
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Hover to see improved version</span>
                </div>
              )}
            </div>
            <ImprovementTooltip improvement={improvements?.promptImprovement}>
              <p className="text-sm cursor-help" style={{ color: 'var(--color-muted-foreground)' }}>
                {selectedSubmission.submission.prompt}
              </p>
            </ImprovementTooltip>
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
                          key === 'best_practices_adherence' ? 30 :
                          key === 'justification_quality' ? 25 :
                          key === 'coverage_balance' ? 20 :
                          key === 'measurability_objectivity' ? 15 :
                          key === 'strategic_improvements' ? 10 :
                          // Fallback for any old field names that might still exist
                          key === 'relevance_coverage' || key === 'specificity_measurability' ? 25 :
                          key === 'user_improvements' ? 20 :
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
                    {/* MECE Analysis */}
                    {gradingResult.specific_feedback.mece_analysis && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                        <p className="text-sm font-medium mb-2" style={{ color: '#3B82F6' }}>
                          MECE Analysis (Mutually Exclusive, Collectively Exhaustive)
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Completeness Score:</span>
                            <span className="font-medium capitalize">
                              {gradingResult.specific_feedback.mece_analysis.completeness_score}
                            </span>
                          </div>
                          {gradingResult.specific_feedback.mece_analysis.overlap_issues?.length > 0 && (
                            <div>
                              <span className="font-medium text-red-600">Overlap Issues:</span>
                              <ul className="mt-1 space-y-1">
                                {gradingResult.specific_feedback.mece_analysis.overlap_issues.map((issue: string, idx: number) => (
                                  <li key={idx} className="ml-2">• {issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {gradingResult.specific_feedback.mece_analysis.coverage_gaps?.length > 0 && (
                            <div>
                              <span className="font-medium text-orange-600">Coverage Gaps:</span>
                              <ul className="mt-1 space-y-1">
                                {gradingResult.specific_feedback.mece_analysis.coverage_gaps.map((gap: string, idx: number) => (
                                  <li key={idx} className="ml-2">• {gap}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Atomicity Check */}
                    {gradingResult.specific_feedback.atomicity_check && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                        <p className="text-sm font-medium mb-2" style={{ color: '#F59E0B' }}>
                          Atomicity Check (One Aspect Per Criterion)
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {gradingResult.specific_feedback.atomicity_check.stacked_criteria?.length > 0 && (
                            <div>
                              <span className="font-medium text-red-600">Problematic (Stacked):</span>
                              <ul className="mt-1 space-y-1">
                                {gradingResult.specific_feedback.atomicity_check.stacked_criteria.map((criterion: string, idx: number) => (
                                  <li key={idx} className="ml-2">• {criterion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {gradingResult.specific_feedback.atomicity_check.properly_atomic?.length > 0 && (
                            <div>
                              <span className="font-medium text-green-600">Good Examples:</span>
                              <ul className="mt-1 space-y-1">
                                {gradingResult.specific_feedback.atomicity_check.properly_atomic.map((criterion: string, idx: number) => (
                                  <li key={idx} className="ml-2">• {criterion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Self-Contained Check */}
                    {gradingResult.specific_feedback.self_contained_check && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                        <p className="text-sm font-medium mb-2" style={{ color: '#22C55E' }}>
                          Self-Contained Check (Complete Information)
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {gradingResult.specific_feedback.self_contained_check.missing_info?.length > 0 && (
                            <div>
                              <span className="font-medium text-red-600">Missing Information:</span>
                              <ul className="mt-1 space-y-1">
                                {gradingResult.specific_feedback.self_contained_check.missing_info.map((criterion: string, idx: number) => (
                                  <li key={idx} className="ml-2">• {criterion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {gradingResult.specific_feedback.self_contained_check.well_specified?.length > 0 && (
                            <div>
                              <span className="font-medium text-green-600">Well Specified:</span>
                              <ul className="mt-1 space-y-1">
                                {gradingResult.specific_feedback.self_contained_check.well_specified.map((criterion: string, idx: number) => (
                                  <li key={idx} className="ml-2">• {criterion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Legacy feedback support (in case old data still has these fields) */}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Final Criteria ({selectedSubmission.criteria.final.length})</h3>
              {improvements?.criteriaImprovements && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4" style={{ color: 'var(--gradient-mid)' }} />
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Hover over criteria to see improvements</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {selectedSubmission.criteria.final.map((criterion, index) => {
                // Find improvement for this criterion
                const improvement = improvements?.criteriaImprovements?.improvements.find(
                  imp => imp.originalId === criterion.id || imp.original === criterion.text
                )
                
                return (
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
                      <ImprovementTooltip improvement={improvement}>
                        <p className={`text-sm ${improvement ? 'cursor-help' : ''}`}>
                          {criterion.finalText || criterion.text}
                        </p>
                      </ImprovementTooltip>
                      <div className="flex gap-4 mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {criterion.source === 'user_added' && (
                          <span className="text-green-600">User Added</span>
                        )}
                        {criterion.status === 'edited' && (
                          <span className="text-blue-600">Edited</span>
                        )}
                        {improvement && (
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" style={{ color: 'var(--gradient-mid)' }} />
                            Improvement available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
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
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-muted)' }}>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'dashboard' 
                      ? 'bg-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2 inline" />
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('submissions')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'submissions' 
                      ? 'bg-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2 inline" />
                  Submissions
                </button>
              </div>
              
              {/* Export Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => exportData('users')}
                  disabled={isExporting}
                  className="btn-secondary"
                  title="Export user data"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Users CSV
                </button>
                <button
                  onClick={() => exportData('submissions')}
                  disabled={isExporting}
                  className="btn-secondary"
                  title="Export submission data"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Submissions CSV
                </button>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4" />
            <p>Loading data...</p>
          </div>
        ) : currentView === 'dashboard' && dashboardData ? (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="card text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
                </div>
                <div className="text-2xl font-bold">{dashboardData.overview.totalUsers}</div>
                <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Total Users</div>
              </div>
              
              <div className="card text-center">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
                </div>
                <div className="text-2xl font-bold">{dashboardData.overview.totalSubmissions}</div>
                <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Submissions</div>
              </div>
              
              <div className="card text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
                </div>
                <div className="text-2xl font-bold">{dashboardData.overview.submissionsPerUser}</div>
                <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Avg per User</div>
              </div>
              
              <div className="card text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5" style={{ color: getScoreColor(dashboardData.overview.averageRubricScore) }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: getScoreColor(dashboardData.overview.averageRubricScore) }}>
                  {dashboardData.overview.averageRubricScore}%
                </div>
                <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Avg Rubric</div>
              </div>
              
              <div className="card text-center">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="w-5 h-5" style={{ color: getScoreColor(dashboardData.overview.averagePromptScore) }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: getScoreColor(dashboardData.overview.averagePromptScore) }}>
                  {dashboardData.overview.averagePromptScore}%
                </div>
                <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Avg Prompt</div>
              </div>
              
              <div className="card text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="w-5 h-5" style={{ color: getScoreColor(dashboardData.overview.averageCombinedScore) }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: getScoreColor(dashboardData.overview.averageCombinedScore) }}>
                  {dashboardData.overview.averageCombinedScore}%
                </div>
                <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Overall Avg</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScoreDistributionChart 
                scores={dashboardData.scoreDistribution.combined} 
                title="Combined" 
              />
              <TimelineChart timeline={dashboardData.submissionTimeline} />
            </div>

            {/* Score Distributions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScoreDistributionChart 
                scores={dashboardData.scoreDistribution.rubric} 
                title="Rubric" 
              />
              <ScoreDistributionChart 
                scores={dashboardData.scoreDistribution.prompt} 
                title="Prompt" 
              />
            </div>

            {/* Top Performers */}
            <div className="card">
              <h3 className="text-lg font-medium mb-4">Top Performers</h3>
              <div className="space-y-3">
                {dashboardData.topPerformers.slice(0, 10).map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-muted)' }}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold" style={{ color: getScoreColor(user.averageCombinedScore) }}>
                          {user.averageCombinedScore}%
                        </div>
                        <div style={{ color: 'var(--color-muted-foreground)' }}>Overall</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{user.totalSubmissions}</div>
                        <div style={{ color: 'var(--color-muted-foreground)' }}>Submissions</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All Users Performance Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">All Users Performance</h3>
                <button
                  onClick={() => exportData('users')}
                  disabled={isExporting}
                  className="btn-secondary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <tr>
                      <th className="text-left py-3 px-2">User</th>
                      <th className="text-center py-3 px-2">Submissions</th>
                      <th className="text-center py-3 px-2">Avg Combined</th>
                      <th className="text-center py-3 px-2">Avg Rubric</th>
                      <th className="text-center py-3 px-2">Avg Prompt</th>
                      <th className="text-center py-3 px-2">Total Actions</th>
                      <th className="text-center py-3 px-2">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.userPerformance.map((user) => (
                      <tr key={user.userId} className="border-b hover:bg-gray-50/50" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="py-3 px-2">
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{user.email}</div>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2">{user.totalSubmissions}</td>
                        <td className="text-center py-3 px-2">
                          <span className="font-bold" style={{ color: getScoreColor(user.averageCombinedScore) }}>
                            {user.averageCombinedScore}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span style={{ color: getScoreColor(user.averageRubricScore) }}>
                            {user.averageRubricScore}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span style={{ color: getScoreColor(user.averagePromptScore) }}>
                            {user.averagePromptScore}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">{user.totalActionsCount}</td>
                        <td className="text-center py-3 px-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                          {new Date(user.lastSubmissionAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : currentView === 'submissions' ? (
          // Submissions view
          submissions.length === 0 ? (
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
          )
        ) : null}
      </main>
    </div>
  )
} 