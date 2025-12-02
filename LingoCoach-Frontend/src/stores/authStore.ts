'use client'

import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('auth-token') : false,
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token')
      window.location.href = '/auth/signin'
    }
    set({ isAuthenticated: false })
  },
}))
