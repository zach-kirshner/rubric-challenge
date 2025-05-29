'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight, AlertCircle, Lock, Mail, User } from 'lucide-react'

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