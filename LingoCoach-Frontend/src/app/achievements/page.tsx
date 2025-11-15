'use client'

import Achievements from '@/components/Achievements'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AchievementsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Achievements />
      </div>
    </ProtectedRoute>
  )
}