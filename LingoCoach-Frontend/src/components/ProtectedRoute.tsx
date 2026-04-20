'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { authAPI } from '@/lib/api'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const { isAuthenticated, setAuth, setUser, logout, user, token, refreshToken } = useAuthStore()

  useEffect(() => {
    const verify = async () => {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

      if (!storedToken) {
        logout()
        return
      }

      // If we already have user data in store, skip the API call
      if (isAuthenticated && user) {
        setChecking(false)
        return
      }

      try {
        const res = await authAPI.me()
        setUser(res.data.user)
        setChecking(false)
      } catch {
        logout()
      }
    }

    verify()
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : null
}
