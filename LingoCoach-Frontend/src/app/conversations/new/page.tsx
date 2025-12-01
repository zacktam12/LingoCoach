'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { conversationAPI } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function NewConversation() {
  const [language, setLanguage] = useState('es')
  const [level, setLevel] = useState('beginner')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const startConversation = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await conversationAPI.sendMessage({
        message: `Hello! Let's talk about ${topic || 'general topics'}.`,
        language,
        level,
      })

      if (response.data.conversationId) {
        router.push(`/conversations/${response.data.conversationId}`)
      } else {
        setError('Could not retrieve conversation ID.')
      }
    } catch (err) {
      setError('Failed to start conversation')
      console.error('Start conversation error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Start New Conversation</h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900 p-4 mb-6">
                  <div className="text-sm text-red-700 dark:text-red-200">
                    {error}
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What would you like to talk about?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Conversation Tips</h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc pl-5 space-y-1">
                    <li>Be yourself and don't worry about making mistakes</li>
                    <li>Ask questions about culture, travel, or daily life</li>
                    <li>Try to use new vocabulary from your lessons</li>
                    <li>Our AI will help correct grammar naturally</li>
                  </ul>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={startConversation}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Starting...
                      </>
                    ) : (
                      'Start Conversation'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}