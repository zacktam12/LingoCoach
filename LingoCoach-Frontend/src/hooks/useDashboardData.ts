"use client"

import { useQuery } from "@tanstack/react-query"
import { dashboardAPI } from "@/lib/api"

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard", "all"],
    queryFn: async () => {
      const [statsRes, progressRes, recommendationsRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getProgress(),
        dashboardAPI.getRecommendations(),
      ])

      return {
        stats: statsRes.status === 'fulfilled' ? statsRes.value.data : {},
        progress: progressRes.status === 'fulfilled' ? (progressRes.value.data.progress || []) : [],
        recommendations: recommendationsRes.status === 'fulfilled' ? recommendationsRes.value.data : {},
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  })
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: async () => {
      const res = await dashboardAPI.getAnalytics()
      return res.data
    },
    staleTime: 5 * 60 * 1000,
  })
}
