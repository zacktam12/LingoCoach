'use client'

import UserProfile from '@/components/UserProfile'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <UserProfile />
      </div>
    </ProtectedRoute>
  )
}