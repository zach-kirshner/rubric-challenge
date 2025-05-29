'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowRight, Trophy, TrendingUp } from 'lucide-react'

export default function ThankYouPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear any stored submission data
    sessionStorage.removeItem('submissionScore')
    sessionStorage.removeItem('submissionGrade')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-2xl w-full px-6">
        <div className="card card-elevated text-center py-12 px-8">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-mid))' }}>
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-lg mb-8" style={{ color: 'var(--color-muted-foreground)' }}>
            Your rubric has been successfully submitted.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-left p-4 rounded-lg" style={{ backgroundColor: 'var(--color-muted)' }}>
              <Trophy className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--gradient-mid)' }} />
              <div>
                <p className="font-medium">Submission Complete</p>
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  Your rubric has been saved and is being reviewed
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-left p-4 rounded-lg" style={{ backgroundColor: 'var(--color-muted)' }}>
              <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--gradient-mid)' }} />
              <div>
                <p className="font-medium">Next Steps</p>
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  We'll review your submission and get back to you soon
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/prompt')}
            className="btn-primary inline-flex items-center gap-2"
          >
            Try Another Prompt
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 