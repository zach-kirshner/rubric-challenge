'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight, AlertCircle, Lock, Mail, User, HelpCircle, ChevronDown, ChevronUp, BookOpen, Target, CheckCircle } from 'lucide-react'

export default function PromptPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)

  // Check if user already has data in session
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('userEmail')
    const storedName = sessionStorage.getItem('userName')
    if (storedEmail) {
      setEmail(storedEmail)
    }
    if (storedName) {
      setFullName(storedName)
    }
  }, [])

  // Rotate loading messages
  useEffect(() => {
    if (!isGenerating) return

    const messages = [
      'Analyzing your prompt...',
      'Generating evaluation criteria...',
      'Refining criteria for clarity...',
      'Finalizing your rubric...'
    ]
    
    let index = 0
    setLoadingMessage(messages[0])
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length
      setLoadingMessage(messages[index])
    }, 2000)

    return () => clearInterval(interval)
  }, [isGenerating])

  // Handle escape key for admin modal
  useEffect(() => {
    if (!showAdminModal) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAdminModal(false)
        setAdminPassword('')
        setAdminError('')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showAdminModal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !prompt.trim() || isGenerating) return

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate full name (at least two words)
    const nameParts = fullName.trim().split(/\s+/)
    if (nameParts.length < 2) {
      setError('Please enter your full name (first and last name)')
      return
    }

    setIsGenerating(true)
    setError('')
    
    try {
      // Store user data in session
      sessionStorage.setItem('userEmail', email)
      sessionStorage.setItem('userName', fullName)

      const response = await fetch('/api/rubric/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, email, fullName }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate rubric')
      }

      const data = await response.json()
      
      // Store in session storage
      sessionStorage.setItem('rubricData', JSON.stringify({
        email,
        fullName,
        prompt,
        rubricItems: data.rubricItems
      }))
      
      router.push('/rubric')
    } catch (error) {
      console.error('Error generating rubric:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate rubric. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle Ctrl/Cmd + Enter for submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  // Handle secret admin access
  const handleIconClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setShowAdminModal(true)
    }
  }

  // Handle admin password submission
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (adminPassword === 'hphbp') {
      sessionStorage.setItem('adminAccess', 'true')
      router.push('/admin')
    } else {
      setAdminError('Invalid password')
      setAdminPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-20"
          style={{ 
            background: 'radial-gradient(circle, var(--gradient-start), transparent)',
            filter: 'blur(100px)'
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full opacity-20"
          style={{ 
            background: 'radial-gradient(circle, var(--gradient-end), transparent)',
            filter: 'blur(100px)'
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6">
        {/* App Header */}
        <div className="text-center mb-12 animate-in">
          <div 
            className="inline-flex items-center justify-center p-3 rounded-2xl mb-6" 
            style={{ background: 'rgba(139, 92, 246, 0.1)' }}
            onClick={handleIconClick}
            title="HFC Rubric Challenge"
          >
            <Zap className="w-8 h-8" style={{ color: 'var(--gradient-mid)' }} />
          </div>
          <h1 className="text-4xl font-bold mb-3">
            HFC Rubric Challenge
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-muted-foreground)' }}>
            Enter your information and task prompt to begin
          </p>
        </div>

        {/* Instructions Section */}
        <div className="mb-8 animate-in" style={{ animationDelay: '0.025s' }}>
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full card card-elevated hover:shadow-lg transition-all duration-200 group"
            style={{ 
              background: showInstructions ? 'rgba(139, 92, 246, 0.05)' : 'var(--color-card-background)',
              borderColor: showInstructions ? 'rgba(139, 92, 246, 0.2)' : 'var(--color-card-border)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <HelpCircle className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
                </div>
                <span className="text-lg font-medium">How to Create a Great Challenge</span>
              </div>
              {showInstructions ? (
                <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-muted-foreground)' }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-muted-foreground)' }} />
              )}
            </div>
          </button>

          {showInstructions && (
            <div className="mt-4 space-y-6 animate-slide-down">
              {/* What is a Rubric? */}
              <div className="card card-elevated">
                <div className="flex items-start gap-3 mb-4">
                  <BookOpen className="w-5 h-5 mt-0.5" style={{ color: 'var(--gradient-mid)' }} />
                  <div className="w-full">
                    <h3 className="font-semibold text-lg mb-2">What is a Rubric?</h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
                      A rubric is a structured evaluation tool that breaks down what makes a good response into specific, 
                      measurable criteria. Each criterion is a clear statement that can be evaluated as true or false.
                    </p>
                    
                    {/* Example */}
                    <div className="p-4 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                      <p className="text-xs font-medium mb-3" style={{ color: 'var(--gradient-mid)' }}>Example:</p>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium mb-1">Task Prompt:</p>
                          <p className="text-xs italic" style={{ color: 'var(--color-muted-foreground)' }}>
                            "What are effective strategies for reducing plastic waste in daily life?"
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium mb-2">Rubric Criteria:</p>
                          <ul className="space-y-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                            <li className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>The response mentions reusable shopping bags as an alternative to plastic bags</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>The response includes specific examples of reusable containers</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>The response explains the environmental impact of plastic waste</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>The response provides at least 3 distinct strategies</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      
                      <p className="text-xs mt-3" style={{ color: 'var(--color-muted-foreground)' }}>
                        Together, these criteria paint a picture of what makes a comprehensive response to the prompt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creating a Task Prompt */}
              <div className="card card-elevated">
                <div className="flex items-start gap-3 mb-4">
                  <Target className="w-5 h-5 mt-0.5" style={{ color: 'var(--gradient-mid)' }} />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Creating a Great Task Prompt</h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
                      Your task prompt is the foundation. It should be challenging enough that AI models need to demonstrate
                      real understanding and reasoning to succeed.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--gradient-mid)' }}>Make it Open-Ended</h4>
                        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                          Allow for multiple valid approaches and responses. The best tasks have many possible good answers
                          that can still be evaluated objectively.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--gradient-mid)' }}>Require Analysis & Synthesis</h4>
                        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                          Don't just ask for information retrieval. Request comparison, evaluation, problem-solving, 
                          or creative application of concepts.
                        </p>
                        <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--gradient-mid)' }}>Good Example:</p>
                          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                            "Design a sustainable urban transportation system for a mid-sized city, considering environmental 
                            impact, cost-effectiveness, and accessibility for all residents."
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--gradient-mid)' }}>Be Specific About Requirements</h4>
                        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                          Include any constraints, format requirements, or specific aspects that must be addressed. 
                          This helps generate more precise evaluation criteria.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--gradient-mid)' }}>Target Appropriate Difficulty</h4>
                        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                          Aim for tasks where current AI models might achieve about 50% of the criteria. Too easy or 
                          too hard won't effectively differentiate performance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What Makes a Good Rubric */}
              <div className="card card-elevated">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 mt-0.5" style={{ color: 'var(--gradient-mid)' }} />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">What Makes a Good Rubric?</h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
                      Our AI will generate evaluation criteria based on your prompt. Understanding what makes 
                      good criteria helps you review and refine them effectively.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--gradient-mid)' }}>Key Principles</h4>
                        <ul className="space-y-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                          <li className="flex items-start gap-2">
                            <span className="text-xs mt-1">•</span>
                            <div>
                              <span className="font-medium">Atomic:</span> Each criterion evaluates exactly one distinct aspect
                              <div className="mt-1 text-xs opacity-80">
                                ❌ "Mentions the capital is Ottawa and has 10 provinces"<br/>
                                ✅ "Mentions the capital of Canada is Ottawa"<br/>
                                ✅ "States that Canada has 10 provinces"
                              </div>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-xs mt-1">•</span>
                            <div>
                              <span className="font-medium">Specific:</span> Clear, binary (true/false) statements that are objective
                              <div className="mt-1 text-xs opacity-80">
                                ❌ "The response is well-written"<br/>
                                ✅ "The response includes at least 3 specific examples"
                              </div>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-xs mt-1">•</span>
                            <div>
                              <span className="font-medium">Self-contained:</span> Contains all information needed to evaluate
                              <div className="mt-1 text-xs opacity-80">
                                ❌ "Mentions the largest planet"<br/>
                                ✅ "Identifies Jupiter as the largest planet in our solar system"
                              </div>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-xs mt-1">•</span>
                            <div>
                              <span className="font-medium">Comprehensive:</span> Together, criteria cover all important aspects of a good response
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-xs mt-1">•</span>
                            <div>
                              <span className="font-medium">Diverse:</span> Include different types of requirements (facts, reasoning, structure, examples)
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Process Steps */}
              <div className="card card-elevated">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                    <Zap className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Your Workflow</h3>
                    <ol className="space-y-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">1.</span>
                        <span>Enter your information and craft a challenging task prompt</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">2.</span>
                        <span>Our AI analyzes your prompt and generates evaluation criteria</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">3.</span>
                        <span>Review the generated rubric - add, edit, or remove criteria as needed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">4.</span>
                        <span>Submit your finalized challenge for the competition</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card card-elevated animate-in" style={{ animationDelay: '0.05s' }}>
              <label htmlFor="fullName" className="block text-sm font-medium mb-3">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-muted-foreground)' }} />
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="input"
                  style={{ paddingLeft: '2.75rem' }}
                  required
                  disabled={isGenerating}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--color-muted-foreground)' }}>
                First and last name required
              </p>
            </div>

            <div className="card card-elevated animate-in" style={{ animationDelay: '0.075s' }}>
              <label htmlFor="email" className="block text-sm font-medium mb-3">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-muted-foreground)' }} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="input"
                  style={{ paddingLeft: '2.75rem' }}
                  required
                  disabled={isGenerating}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--color-muted-foreground)' }}>
                We'll use this to track your submission
              </p>
            </div>
          </div>

          <div className="card card-elevated animate-in" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="prompt" className="block text-sm font-medium mb-3">
              Task Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the task you want to evaluate..."
              className="textarea"
              rows={6}
              required
              disabled={isGenerating}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--color-muted-foreground)' }}>
              Be specific about what you want the AI to accomplish • Press Ctrl+Enter to submit
            </p>
          </div>

          {error && (
            <div className="card animate-in" style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderColor: 'rgba(239, 68, 68, 0.3)',
              animationDelay: '0.15s'
            }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: '#EF4444' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#EF4444' }}>Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center animate-in" style={{ animationDelay: '0.2s' }}>
            <button
              type="submit"
              disabled={!fullName.trim() || !email.trim() || !prompt.trim() || isGenerating}
              className="btn-primary group"
            >
              {isGenerating ? (
                <>
                  <div className="spinner mr-2" />
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <>
                  Generate Rubric
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => {
              setShowAdminModal(false)
              setAdminPassword('')
              setAdminError('')
            }}
          />
          
          <div className="relative w-full max-w-sm card card-elevated animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                <Lock className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
              </div>
              <h2 className="text-xl font-semibold">Admin Access</h2>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="admin-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="input"
                  placeholder="Enter admin password"
                  autoFocus
                  required
                />
                {adminError && (
                  <p className="text-sm mt-2" style={{ color: '#EF4444' }}>{adminError}</p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false)
                    setAdminPassword('')
                    setAdminError('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Access Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 