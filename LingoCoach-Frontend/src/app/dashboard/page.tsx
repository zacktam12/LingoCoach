'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import { BookOpen, MessageCircle, Mic, Trophy, Calendar, Sparkles, LayoutDashboard, Settings, ArrowRight, Bot, X, Send } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Spinner } from '@/components/ui/spinner'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { conversationAPI } from '@/lib/api'

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardData()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([
    { id: '1', role: 'assistant', content: 'Hi there! How can I help you practice today?' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSubmitting) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage
    }]);

    setIsSubmitting(true);

    try {
      const response = await conversationAPI.sendMessage({
        message: userMessage,
        conversationId,
        language: 'en',
        level: 'beginner'
      });

      if (response.data.conversationId) {
        setConversationId(response.data.conversationId);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I had trouble processing that. Please try again."
      }]);
    } finally {
      setIsSubmitting(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center">
          <Spinner className="h-12 w-12 text-primary animate-pulse" />
          <p className="mt-4 text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-20 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-2xl border border-red-100 dark:border-red-900 shadow-xl flex items-center gap-4">
        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
          <Sparkles className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg">System Offline</h3>
          <p>I couldn't reach your learning data. Please try again in a moment.</p>
        </div>
      </div>
    )
  }

  const stats = data?.stats || {}
  const recommendations = data?.recommendations || {}

  const metricCards = [
    { icon: <BookOpen className="h-6 w-6" />, label: 'Lessons', value: stats.lessonsCompleted || 0, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: <MessageCircle className="h-6 w-6" />, label: 'Chats', value: stats.conversationsCount || 0, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: <Trophy className="h-6 w-6" />, label: 'Points', value: stats.totalScore || 0, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { icon: <Calendar className="h-6 w-6" />, label: 'Streak', value: stats.streakDays || 0, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' }
  ]

  const actionCards = [
    recommendations.recommendedLesson && {
      title: 'Continue Lesson',
      label: recommendations.recommendedLesson.title || 'Untitled',
      href: `/lessons/${recommendations.recommendedLesson.id}`,
      icon: <BookOpen className="h-5 w-5" />,
      primary: true
    },
    recommendations.recommendedConversation && {
      title: 'Practice Speaking',
      label: `Chat in ${(recommendations.recommendedConversation.language || 'English').toUpperCase()}`,
      href: `/conversations/new`,
      icon: <MessageCircle className="h-5 w-5" />,
      primary: false
    }
  ].filter(Boolean)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          
          {/* Header Area */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Welcome Back! 👋</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                It's great to see you. Ready to dive back into your learning journey?
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/profile" className="p-2 rounded-full hover:bg-secondary/50 transition-colors">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </Link>
            </div>
          </div>

          <motion.div 
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.section variants={itemVariants} className="mb-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Progress
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metricCards.map((stat, idx) => (
                  <div key={idx} className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors">
                    <div className={`${stat.color} ${stat.bg} p-3 rounded-xl mb-3`}>
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-black mb-1">{stat.value}</div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.section>

            {actionCards.length > 0 && (
              <motion.section variants={itemVariants} className="mb-10">
                <h2 className="text-xl font-bold mb-4 text-foreground">Next Steps</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {actionCards.map((action: any, aIdx: number) => (
                    <Link key={aIdx} href={action.href}>
                      <div className={`group flex flex-col h-full justify-between p-6 rounded-2xl border transition-all duration-300 ${
                        action.primary 
                          ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/20 hover:-translate-y-1' 
                          : 'bg-card text-foreground border-border hover:bg-secondary/50 hover:border-primary/50'
                      }`}>
                        <div>
                          <div className={`p-3 w-fit rounded-xl mb-4 ${action.primary ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                            {action.icon}
                          </div>
                          <h3 className="text-sm font-semibold opacity-80 uppercase tracking-wide mb-1">{action.title}</h3>
                          <p className={`text-xl font-bold line-clamp-2 ${action.primary ? 'text-white' : 'text-foreground'}`}>{action.label}</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                           <ArrowRight className={`h-6 w-6 transition-transform group-hover:translate-x-2 ${action.primary ? 'text-white/80' : 'text-primary'}`} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Quick Shortcuts Bar */}
            <motion.section variants={itemVariants} className="pt-6 border-t border-border">
              <h2 className="text-lg font-bold mb-4 text-foreground opacity-80">Quick Links</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/pronunciation" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform">
                    <Mic className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Pronunciation</span>
                </Link>
                <Link href="/conversations/new" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-foreground">AI Chat</span>
                </Link>
                <Link href="/achievements" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group">
                  <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-600 group-hover:scale-110 transition-transform">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Rewards</span>
                </Link>
                <Link href="/lessons" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Library</span>
                </Link>
              </div>
            </motion.section>

          </motion.div>
        </div>
      </div>

      {/* Floating AI Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-4 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex flex-col justify-center items-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">AI Tutor</h3>
                    <p className="text-[10px] text-primary-foreground/80 lowercase">Always here to help</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                        : 'bg-secondary text-secondary-foreground rounded-bl-none'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isSubmitting && (
                  <div className="flex justify-start">
                    <div className="bg-secondary p-4 rounded-2xl rounded-bl-none">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-card border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a quick question..."
                    className="flex-1 bg-secondary border-transparent focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2 text-sm transition-all outline-none"
                    disabled={isSubmitting}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isSubmitting}
                    className="p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 ${
            isChatOpen ? 'bg-secondary text-foreground' : 'bg-primary text-white'
          }`}
        >
          {isChatOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>
    </ProtectedRoute>
  )
}