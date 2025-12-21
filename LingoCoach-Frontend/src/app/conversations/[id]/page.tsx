'use client'

import { useState, useEffect, useRef } from 'react'
import { conversationAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Send, Bot, User } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Spinner } from '@/components/ui/spinner'
import { io, Socket } from 'socket.io-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function ConversationDetail({ params }: { params: { id: string } }) {
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchConversation()
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsSocketConnected(true)
      socket.emit('join-conversation', params.id)
    })

    socket.on('disconnect', () => {
      setIsSocketConnected(false)
    })

    socket.on('ai-response', (data: any) => {
      const aiMessage = {
        id: Date.now(),
        role: 'assistant',
        content: data.message,
        suggestions: data.suggestions,
        grammarCorrections: data.grammarCorrections,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    })

    return () => {
      socket.off('ai-response')
      socket.disconnect()
      socketRef.current = null
    }
  }, [params.id])

  const fetchConversation = async () => {
    try {
      setLoading(true)
      const response = await conversationAPI.getConversation(params.id)
      setConversation(response.data.conversation)

      // Parse messages from the conversation object
      if (response.data.conversation.messages) {
        // Assuming messages is an array of message objects
        setMessages(response.data.conversation.messages)
      } else {
        // Fallback to sample conversation if no messages exist
        setMessages([
          {
            id: 1,
            role: 'assistant',
            content: 'Hello! I\'m your AI language tutor. What would you like to practice today?',
            timestamp: new Date()
          }
        ])
      }
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

    const messageToSend = newMessage.trim()

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    }

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage])
    setNewMessage('')
    setError(null)
    setSending(true)

    try {
      if (socketRef.current && isSocketConnected) {
        socketRef.current.emit('send-message', {
          conversationId: params.id,
          message: messageToSend,
          language: conversation?.language || 'en',
          level: conversation?.level || 'beginner',
        })
      } else {
        // Fallback to HTTP API if WebSocket is not connected
        const response = await conversationAPI.sendMessage({
          message: messageToSend,
          conversationId: params.id,
          language: conversation?.language || 'en',
          level: conversation?.level || 'beginner',
        })

        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.message,
          suggestions: response.data.suggestions,
          grammarCorrections: response.data.grammarCorrections,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      }
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

  const aiUnavailable = messages.some(
    (m) =>
      m.role === 'assistant' &&
      typeof m.content === 'string' &&
      m.content.includes("trouble connecting to the AI tutor")
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner className="h-12 w-12 text-blue-600" />
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-card rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            {/* Header */}
            <div className="border-b border-border p-4">
              <h1 className="text-xl font-bold text-foreground">
                {conversation?.title || `Conversation in ${conversation?.language || 'English'}`}
              </h1>
              <p className="text-sm text-muted-foreground">
                Level: {conversation?.level || 'Beginner'}
              </p>
            </div>

            {aiUnavailable && (
              <div className="bg-amber-50 text-amber-800 text-xs px-4 py-2 border-b border-amber-200">
                AI tutor is temporarily unavailable. You can still practice by writing messages; responses may be limited.
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id || message.timestamp}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
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
                        <div className="mt-2 pt-2 border-t border-border/50">
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
            <div className="border-t border-border p-4">
              <div className="flex">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border border-border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  rows={1}
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-r-lg hover:bg-primary/90 disabled:opacity-50 flex items-center"
                >
                  {sending ? (
                    <Spinner className="h-5 w-5" />
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