'use client'

import PronunciationPractice from '@/components/PronunciationPractice'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function PronunciationPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pronunciation Practice</h1>
          <PronunciationPractice />
        </div>
      </div>
    </ProtectedRoute>
  )
}