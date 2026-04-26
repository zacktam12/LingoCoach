'use client'

import { create } from 'zustand'

interface PreferencesState {
  targetLanguage: string | null
  learningLevel: string | null
  setPreferences: (prefs: { targetLanguage?: string | null; learningLevel?: string | null }) => void
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  targetLanguage: null,
  learningLevel: null,
  setPreferences: (prefs) =>
    set((state) => ({
      targetLanguage: prefs.targetLanguage ?? state.targetLanguage,
      learningLevel: prefs.learningLevel ?? state.learningLevel,
    })),
}))
