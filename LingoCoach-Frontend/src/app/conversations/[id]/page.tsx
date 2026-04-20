'use client'

import { useState, useEffect, useRef } from 'react'
import { conversationAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Send, Bot, User, Mic, Phone, PhoneOff, Headphones } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Spinner } from '@/components/ui/spinner'
import { io, Socket } from 'socket.io-client'
import SpeechSynthesis from '@/components/SpeechSynthesis'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function ConversationDetail({ params }: { params: { id: string } }) {
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const conversationRef = useRef<any>(null)
  
  useEffect(() => {
    conversationRef.current = conversation
  }, [conversation])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  
  const [isVoiceMode, setIsVoiceModeState] = useState(false)
  const isVoiceModeRef = useRef(false)
  const sendMessageRef = useRef<any>(null)
  
  const router = useRouter()

  const setIsVoiceMode = (val: boolean) => {
    isVoiceModeRef.current = val
    setIsVoiceModeState(val)
    if (val) {
      // Pre-warm the Web Speech API on user interaction to bypass autoplay restrictions
      const dummy = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(dummy);
      
      if (recognitionRef.current && !isRecording) {
        try {
          recognitionRef.current.start()
          setIsRecording(true)
        } catch(e) {}
      }
    } else {
      window.speechSynthesis.cancel()
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop()
        setIsRecording(false)
      }
    }
  }

  const speakThenListen = (text: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const lang = conversationRef.current?.language || 'en'
    utterance.lang = lang === 'en' ? 'en-US' : (lang === 'es' ? 'es-ES' : lang)
    utterance.rate = 0.95
    utterance.onend = () => {
      // Once AI finishes speaking, auto-start microphone if still in voice mode
      if (isVoiceModeRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start()
          setIsRecording(true)
        } catch(e) {}
      }
    }
    window.speechSynthesis.speak(utterance)
  }

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
      
      if (isVoiceModeRef.current) {
        speakThenListen(data.message)
      }
    })

    // Listen for typing indicators
    socket.on('typing', (data: any) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev, data.sender || 'AI Tutor'])
      } else {
        setTypingUsers(prev => prev.filter(user => user !== data.sender))
      }
    })

    // Listen for message receipts
    socket.on('message-receipt', (data: any) => {
      console.log('Message receipt:', data)
      // Could be used to show delivery status
    })

    // Listen for read receipts
    socket.on('message-read', (data: any) => {
      console.log('Message read by:', data.readerId)
      // Could be used to show read status
    })

    return () => {
      socket.off('ai-response')
      socket.off('typing')
      socket.off('message-receipt')
      socket.off('message-read')
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

  // Effect to sync sendMessage reference
  useEffect(() => {
    sendMessageRef.current = sendMessage
  })

  const sendMessage = async (textOverride?: string | React.MouseEvent | React.KeyboardEvent) => {
    // If textOverride is a string it's an auto-call, otherwise it's an event (or undefined)
    const explicitText = typeof textOverride === 'string' ? textOverride.trim() : ''
    const textToSend = explicitText || newMessage.trim()
    
    if (!textToSend || sending) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    }

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage])
    
    if (!explicitText) {
      setNewMessage('')
    }
    
    setError(null)
    setSending(true)

    // Stop listening during AI processing if we are in voice mode
    if (isVoiceModeRef.current && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }

    try {
      if (socketRef.current && isSocketConnected) {
        socketRef.current.emit('send-message', {
          conversationId: params.id,
          message: textToSend,
          language: conversation?.language || 'en',
          level: conversation?.level || 'beginner',
        })
      } else {
        // Fallback to HTTP API if WebSocket is not connected
        const response = await conversationAPI.sendMessage({
          message: textToSend,
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
        
        if (isVoiceModeRef.current) {
          speakThenListen(response.data.message)
        }
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

  const handleTyping = () => {
    if (socketRef.current && isSocketConnected && params.id) {
      socketRef.current.emit('start-typing', { conversationId: params.id })
      
      // Clear any existing timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
      
      // Set a new timer to stop typing after 1.5 seconds of inactivity
      typingTimerRef.current = setTimeout(() => {
        socketRef.current?.emit('stop-typing', { conversationId: params.id })
      }, 1500)
    }
  }

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
    }
  }, [])

  // Set up speech recognition
  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
        
        // Use finalTranscript if available
        if (finalTranscript) {
          if (isVoiceModeRef.current) {
            // Auto-send immediately
            if (sendMessageRef.current) {
              sendMessageRef.current(finalTranscript)
            }
          } else {
            setNewMessage(prev => prev ? prev + ' ' + finalTranscript : finalTranscript)
          }
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (recognitionRef.current && conversation?.language) {
      const lang = conversation.language
      recognitionRef.current.lang = lang === 'en' ? 'en-US' : (lang === 'es' ? 'es-ES' : lang)
    }
  }, [conversation?.language])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser.")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
      } catch (e) {
        console.error(e)
      }
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
            <div className="border-b border-border p-4 flex justify-between items-center bg-card">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {conversation?.title || `Conversation in ${conversation?.language || 'English'}`}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Level: {conversation?.level || 'Beginner'}
                </p>
              </div>
              <button 
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all shadow-md ${
                  isVoiceMode 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-[pulse_2s_ease-in-out_infinite]' 
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {isVoiceMode ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                {isVoiceMode ? "End Call Mode" : "Hands-Free"}
              </button>
            </div>

            {isVoiceMode && (
              <div className="bg-primary/5 border-b border-primary/20 p-2 text-center flex items-center justify-center gap-2 text-primary font-medium text-sm">
                <Headphones className="h-4 w-4 animate-bounce" />
                Hands-free voice call active. I am listening...
              </div>
            )}

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
                      <div className="flex items-start justify-between gap-2">
                        <p className="whitespace-pre-wrap flex-1">{message.content}</p>
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0">
                            <SpeechSynthesis text={message.content} language={conversation?.language || 'en'} />
                          </div>
                        )}
                      </div>
                      
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
                
                {/* Typing Indicators */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-secondary text-secondary-foreground">
                      <div className="flex items-center">
                        <Bot className="h-4 w-4 mr-2" />
                        <span className="text-xs font-medium">AI Tutor</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="ml-2 text-sm">is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border p-4 bg-card/50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-3 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' 
                      : 'bg-secondary text-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                  title={isRecording ? "Stop recording (Speak now)" : "Start speaking"}
                >
                  <Mic className="h-5 w-5" />
                </button>
                <div className="flex flex-1 items-center bg-background rounded-2xl overflow-hidden border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={isRecording ? "Listening..." : "Type your message..."}
                    className="flex-1 px-4 py-3 bg-transparent focus:outline-none resize-none"
                    rows={1}
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-primary text-primary-foreground h-full px-6 py-3 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center transition-colors"
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
      </div>
    </ProtectedRoute>
  )
}