'use client'

import { useState } from 'react'
import { lessonAPI } from '@/lib/api'
import { useLessonDetailQuery } from '@/hooks/useLessons'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function LessonDetail({ params }: { params: { id: string } }) {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { data: lesson, isLoading } = useLessonDetailQuery(params.id)

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

  if (isLoading) {
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
                {lesson.category && (
                  <span className="capitalize mr-4">{lesson.category}</span>
                )}
                <span>{lesson.duration || 10} min</span>
              </div>
              
              <div className="prose dark:prose-invert max-w-none mb-8">
                {(() => {
                  const content = lesson.content

                  if (!content) {
                    return (
                      <p className="text-gray-700 dark:text-gray-300">
                        This is a sample lesson content. In a real application, this would contain
                        interactive exercises, multimedia content, and assessments.
                      </p>
                    )
                  }

                  if (typeof content === 'string') {
                    return (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {content}
                      </p>
                    )
                  }

                  if (typeof content === 'object') {
                    const anyContent = content as any
                    const vocabulary = Array.isArray(anyContent.vocabulary) ? anyContent.vocabulary : []
                    const grammar = Array.isArray(anyContent.grammar) ? anyContent.grammar : []
                    const practice = Array.isArray(anyContent.practice) ? anyContent.practice : []

                    return (
                      <div className="space-y-8">
                        {vocabulary.length > 0 && (
                          <section>
                            <h2 className="text-xl font-semibold mb-3">Vocabulary</h2>
                            <ul className="list-disc pl-5 space-y-1">
                              {vocabulary.map((item: any, index: number) => (
                                <li key={index}>
                                  <span className="font-medium">{item.term}</span>
                                  {item.translation && (
                                    <span className="text-gray-600 dark:text-gray-400"> — {item.translation}</span>
                                  )}
                                  {item.example && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      Example: {item.example}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {grammar.length > 0 && (
                          <section>
                            <h2 className="text-xl font-semibold mb-3">Grammar</h2>
                            <div className="space-y-3">
                              {grammar.map((rule: any, index: number) => (
                                <div key={index}>
                                  {rule.title && (
                                    <h3 className="font-medium mb-1">{rule.title}</h3>
                                  )}
                                  {rule.explanation && (
                                    <p className="text-gray-700 dark:text-gray-300 mb-1">
                                      {rule.explanation}
                                    </p>
                                  )}
                                  {Array.isArray(rule.examples) && rule.examples.length > 0 && (
                                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                                      {rule.examples.map((ex: string, i: number) => (
                                        <li key={i}>{ex}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {practice.length > 0 && (
                          <section>
                            <h2 className="text-xl font-semibold mb-3">Practice</h2>
                            <ol className="list-decimal pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                              {practice.map((task: any, index: number) => (
                                <li key={index}>{task}</li>
                              ))}
                            </ol>
                          </section>
                        )}

                        {vocabulary.length === 0 && grammar.length === 0 && practice.length === 0 && (
                          <p className="text-gray-700 dark:text-gray-300">
                            This lesson content is not structured yet. It will be enhanced with
                            vocabulary, grammar, and practice sections.
                          </p>
                        )}
                      </div>
                    )
                  }

                  return (
                    <p className="text-gray-700 dark:text-gray-300">
                      Lesson content format not recognized.
                    </p>
                  )
                })()}
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