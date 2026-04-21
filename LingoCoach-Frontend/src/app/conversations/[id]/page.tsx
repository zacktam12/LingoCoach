'use client'

import { useState, useEffect, useRef } from 'react'
import { conversationAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Send, Bot, User, Mic, Phone, PhoneOff, Headphones, MessageCircle } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { io, Socket } from 'socket.io-client'
import SpeechSynthesis from '@/components/SpeechSynthesis'

import { getFullLangCode } from '@/components/SpeechSynthesis'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

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
    utterance.lang = getFullLangCode(lang)
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
      <div className="flex flex-col h-screen max-h-screen bg-background overflow-hidden relative">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-md z-10 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex w-10 h-10 rounded-full gemini-gradient items-center justify-center text-white shadow-md">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight">
                {conversation?.title || `Conversation in ${conversation?.language || 'English'}`}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {conversation?.language?.toUpperCase() || 'EN'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {conversation?.level || 'Beginner'} Level
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsVoiceMode(!isVoiceMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl font-medium transition-all shadow-sm border",
                isVoiceMode 
                  ? 'bg-red-500 border-red-600 text-white animate-pulse' 
                  : 'bg-card border-border text-foreground hover:bg-accent'
              )}
            >
              {isVoiceMode ? <PhoneOff size={18} /> : <Phone size={18} />}
              <span className="hidden sm:inline">{isVoiceMode ? "End Voice" : "Voice Mode"}</span>
            </button>
          </div>
        </header>

        {isVoiceMode && (
          <div className="flex-shrink-0 bg-primary/10 border-b border-primary/20 p-3 text-center flex items-center justify-center gap-3 text-primary font-medium text-sm animate-fade-in">
            <div className="flex gap-1">
              {[0.1, 0.3, 0.5, 0.7].map((delay) => (
                <div 
                  key={delay}
                  className="w-1 h-4 bg-primary rounded-full animate-bounce" 
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
            Hands-free mode active. Just speak, I'm listening.
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl gemini-gradient flex items-center justify-center text-white shadow-2xl animate-bounce">
                  <MessageCircle size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">How can I help you today?</h2>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    I'm your AI Language Coach. We can practice speaking, grammar, or just have a friendly chat in {conversation?.language || 'English'}.
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={cn(
                  "flex flex-col gap-2 group animate-fade-in",
                  message.role === 'user' ? "items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "flex gap-3 max-w-[85%] md:max-w-[75%]",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1",
                    message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}>
                    {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  
                  <div className={cn(
                    "flex flex-col gap-2",
                    message.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-5 py-3.5 shadow-sm text-[15px] leading-relaxed",
                      message.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-[1.5rem] rounded-tr-none" 
                        : "bg-card text-card-foreground border border-border rounded-[1.5rem] rounded-tl-none"
                    )}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                        <SpeechSynthesis text={message.content} language={conversation?.language || 'en'} />
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          AI Tutor
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggestions and Corrections */}
                {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                  <div className="ml-11 flex flex-wrap gap-2 mt-1">
                    {message.suggestions.map((suggestion: string, i: number) => (
                      <button 
                        key={i}
                        onClick={() => setNewMessage(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-start gap-3 animate-fade-in">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Bot size={16} className="text-secondary-foreground" />
                </div>
                <div className="px-5 py-3.5 bg-card border border-border rounded-[1.5rem] rounded-tl-none flex items-center gap-2 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-border bg-background/80 backdrop-blur-lg px-4 py-6 md:pb-8">
          <div className="max-w-4xl mx-auto relative">
            {aiUnavailable && (
              <div className="absolute -top-12 left-0 right-0 mx-auto w-fit px-4 py-1.5 bg-amber-500/10 text-amber-600 text-xs font-medium rounded-full border border-amber-500/20 mb-4 animate-fade-in">
                AI tutor is temporarily limited. I'll still help as much as I can!
              </div>
            )}

            <div className="flex items-end gap-2 md:gap-4">
              <button
                type="button"
                onClick={toggleRecording}
                className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md",
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/20' 
                    : 'bg-secondary text-foreground hover:bg-primary hover:text-white'
                )}
              >
                <Mic size={20} />
              </button>

              <div className="flex-1 relative group">
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder={isRecording ? "Listening to you..." : "Message LingoCoach..."}
                  className="w-full bg-card border border-border rounded-2xl md:rounded-[2rem] px-5 py-3.5 md:py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm resize-none max-h-32 overflow-y-auto"
                  rows={1}
                  disabled={sending}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={sending || !newMessage.trim()}
                  className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:hover:bg-primary transition-all"
                >
                  {sending ? (
                    <Spinner className="w-5 h-5 border-2 border-white/30 border-t-white" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-muted-foreground mt-3">
              LingoCoach can make mistakes. Consider checking important grammar rules.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}