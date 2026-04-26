'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string | null
  image?: string | null
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  refreshToken: string | null
  setAuth: (token: string, refreshToken: string, user: User) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,

      setAuth: (token, refreshToken, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', token)
          localStorage.setItem('refresh-token', refreshToken)
        }
        set({ isAuthenticated: true, token, refreshToken, user })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token')
          localStorage.removeItem('refresh-token')
          if (!window.location.pathname.startsWith('/auth/')) {
            window.location.href = '/auth/signin'
          }
        }
        set({ isAuthenticated: false, user: null, token: null, refreshToken: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
)
