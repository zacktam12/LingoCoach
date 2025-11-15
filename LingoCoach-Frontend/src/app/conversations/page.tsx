'use client'

import { useState, useEffect } from 'react'
import { conversationAPI } from '@/lib/api'
import { MessageCircle, Plus, Clock, Globe } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function Conversations() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await conversationAPI.getConversations()
      setConversations(response.data.conversations || [])
    } catch (err) {
      setError('Failed to load conversations')
      console.error('Fetch conversations error:', err)
    } finally {
      setLoading(false)
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Conversations</h1>
            <Link href="/conversations/new">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </button>
            </Link>
          </div>
          
          {/* Active Conversations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Conversations</h2>
            
            {conversations.length > 0 ? (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <Link key={conversation.id} href={`/conversations/${conversation.id}`}>
                    <div className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                        <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {conversation.title || `Conversation in ${conversation.language}`}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <Globe className="h-4 w-4 mr-1" />
                          <span className="capitalize mr-3">{conversation.language}</span>
                          <span className="capitalize">{conversation.level}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No conversations yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start a new conversation to practice your language skills.
                </p>
                <Link href="/conversations/new">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Start Conversation
                  </button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Conversation Tips */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Conversation Tips</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Be Consistent</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Practice daily to build confidence and fluency in your target language.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Don't Fear Mistakes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mistakes are part of learning. Our AI will help you correct them naturally.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Ask Questions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Be curious! Ask about culture, idioms, and real-life usage of the language.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}