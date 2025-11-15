'use client'

import { useState, useEffect, useRef } from 'react'
import { conversationAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Send, Bot, User } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function ConversationDetail({ params }: { params: { id: string } }) {
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchConversation()
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversation = async () => {
    try {
      setLoading(true)
      const response = await conversationAPI.getConversation(params.id)
      setConversation(response.data.conversation)
      // In a real app, you would parse the messages from the conversation object
      // For now, we'll use a sample conversation
      setMessages([
        {
          id: 1,
          role: 'assistant',
          content: 'Hello! I\'m your AI language tutor. What would you like to practice today?',
          timestamp: new Date()
        }
      ])
    } catch (err) {
      setError('Failed to load conversation')
      console.error('Fetch conversation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: newMessage,
        timestamp: new Date()
      }

      // Add user message to UI immediately
      setMessages(prev => [...prev, userMessage])
      setNewMessage('')

      // Send to backend
      const response = await conversationAPI.sendMessage({
        message: newMessage,
        conversationId: params.id,
        language: conversation?.language || 'en',
        level: conversation?.level || 'beginner'
      })

      // Add AI response to UI
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.message,
        suggestions: response.data.suggestions,
        grammarCorrections: response.data.grammarCorrections,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      setError('Failed to send message')
      console.error('Send message error:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {conversation?.title || `Conversation in ${conversation?.language || 'English'}`}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Level: {conversation?.level || 'Beginner'}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        {message.role === 'assistant' ? (
                          <Bot className="h-4 w-4 mr-2" />
                        ) : (
                          <User className="h-4 w-4 mr-2" />
                        )}
                        <span className="text-xs font-medium">
                          {message.role === 'user' ? 'You' : 'AI Tutor'}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs font-medium mb-1">Suggestions:</p>
                          <ul className="text-xs list-disc pl-4 space-y-1">
                            {message.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={1}
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}