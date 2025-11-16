'use client'

import { useState, useEffect } from 'react'
import { lessonAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function LessonDetail({ params }: { params: { id: string } }) {
  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchLesson()
  }, [params.id])

  const fetchLesson = async () => {
    try {
      setLoading(true)
      const response = await lessonAPI.getLesson(params.id)
      setLesson(response.data.lesson)
    } catch (err) {
      setError('Failed to load lesson')
      console.error('Fetch lesson error:', err)
    } finally {
      setLoading(false)
    }
  }

  const completeLesson = async () => {
    try {
      await lessonAPI.completeLesson({
        lessonId: params.id,
        score: 95, // This would be calculated based on user performance
        timeSpent: 15 // This would be tracked during the lesson
      })
      router.push('/lessons')
    } catch (err) {
      setError('Failed to complete lesson')
      console.error('Complete lesson error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
        {error}
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {lesson ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {lesson.title}
              </h1>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-6">
                <span className="capitalize mr-4">{lesson.language}</span>
                <span className="capitalize mr-4">{lesson.level}</span>
                <span>{lesson.duration || 10} min</span>
              </div>
              
              <div className="prose dark:prose-invert max-w-none mb-8">
                {lesson.content ? (
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    This is a sample lesson content. In a real application, this would contain 
                    interactive exercises, multimedia content, and assessments.
                  </p>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={completeLesson}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Complete Lesson
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Lesson not found</h2>
              <p className="text-gray-600 dark:text-gray-400">
                The lesson you're looking for doesn't exist or has been removed.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}