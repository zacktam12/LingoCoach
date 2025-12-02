"use client"

import { useQuery } from "@tanstack/react-query"
import { practiceAPI, userAPI } from "@/lib/api"

export function usePracticeData() {
  return useQuery({
    queryKey: ["practice", "sentences-and-preferences"],
    queryFn: async () => {
      const [practiceRes, prefsRes] = await Promise.all([
        practiceAPI.getSentences(),
        userAPI.getPreferences().catch(() => null),
      ])

      return {
        sentences: practiceRes.data.sentences || [],
        preferences: prefsRes?.data?.preferences,
      }
    },
  })
}
