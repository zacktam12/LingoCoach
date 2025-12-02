"use client"

import { useQuery } from "@tanstack/react-query"
import { userAPI } from "@/lib/api"
import { usePreferencesStore } from "@/stores/preferencesStore"

interface UserPreferences {
  targetLanguage?: string | null
  learningLevel?: string | null
  [key: string]: any
}

export function useUserPreferences() {
  const setPreferences = usePreferencesStore((state) => state.setPreferences)

  return useQuery<UserPreferences | null>({
    queryKey: ["user", "preferences"],
    queryFn: async () => {
      const response = await userAPI.getPreferences()
      const prefs: UserPreferences | null = response.data.preferences || null

      if (prefs) {
        setPreferences({
          targetLanguage: prefs.targetLanguage || null,
          learningLevel: prefs.learningLevel || null,
        })
      }

      return prefs
    },
  })
}
