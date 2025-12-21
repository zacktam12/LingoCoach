"use client"

import { useQuery } from "@tanstack/react-query"
import { dashboardAPI } from "@/lib/api"

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard", "all"],
    queryFn: async () => {
      const [statsResponse, progressResponse, analyticsResponse, recommendationsResponse] =
        await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getProgress(),
          dashboardAPI.getAnalytics(),
          dashboardAPI.getRecommendations(),
        ])

      return {
        stats: statsResponse.data,
        progress: progressResponse.data.progress || [],
        analytics: analyticsResponse.data,
        recommendations: recommendationsResponse.data,
      }
    },
  })
}
