"use client"

import { useQuery } from "@tanstack/react-query"
import { lessonAPI } from "@/lib/api"

export interface LessonsFilter {
  language?: string
  level?: string
  category?: string
}

export function useLessonsQuery(filter: LessonsFilter) {
  return useQuery({
    queryKey: ["lessons", filter],
    queryFn: async () => {
      const params: any = {}
      if (filter.language) params.language = filter.language
      if (filter.level) params.level = filter.level
      if (filter.category) params.category = filter.category

      const response = await lessonAPI.getLessons(params)
      return response.data.lessons || []
    },
  })
}

export function useLessonDetailQuery(id: string) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const response = await lessonAPI.getLesson(id)
      return response.data.lesson
    },
  })
}
