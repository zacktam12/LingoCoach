'use client'

import PronunciationPractice from '@/components/PronunciationPractice'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function PronunciationPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-4">
              Pronunciation Coach
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Refine your accent and speaking skills with real-time AI feedback.
            </p>
          </div>
          <PronunciationPractice />
        </div>
      </div>
    </ProtectedRoute>
  )
}