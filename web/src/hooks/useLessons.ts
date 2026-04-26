"use client"

import { useQuery } from "@tanstack/react-query"
import { lessonAPI } from "@/lib/api"

export interface LessonsFilter {
  language?: string
  level?: string
  category?: string
  page?: number
  limit?: number
}

export function useLessonsQuery(filter: LessonsFilter) {
  return useQuery({
    queryKey: ["lessons", filter],
    queryFn: async () => {
      const response = await lessonAPI.getLessons(filter)
      return response.data.lessons || []
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  })
}

export function useLessonDetailQuery(id: string) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const response = await lessonAPI.getLesson(id)
      return response.data.lesson
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}
