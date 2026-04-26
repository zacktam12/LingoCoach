'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import { BookOpen, MessageCircle, Mic, Trophy, Calendar, Sparkles, LayoutDashboard, Settings, ArrowRight, Bot, X, Send, Plus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
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
      <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-6 py-12">
          
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-4">
                Welcome back! 👋
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Ready to continue your language journey? Here's a snapshot of your progress and recommended next steps.
              </p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/conversations/new" 
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                <Plus size={20} />
                New Chat
              </Link>
            </div>
          </div>

          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Left Column: Stats & Recommendations */}
            <div className="lg:col-span-2 space-y-10">
              <motion.section variants={itemVariants}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                  <div className="w-8 h-8 rounded-lg gemini-gradient flex items-center justify-center text-white shadow-sm">
                    <Trophy size={18} />
                  </div>
                  Your Performance
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {metricCards.map((stat, idx) => (
                    <div key={idx} className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md hover:border-primary/20 transition-all group">
                      <div className={`${stat.color} ${stat.bg} p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                        {stat.icon}
                      </div>
                      <div className="text-3xl font-black mb-1">{stat.value}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section variants={itemVariants}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                    <Sparkles size={18} />
                  </div>
                  Recommended for You
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {actionCards.map((action: any, aIdx: number) => (
                    <Link key={aIdx} href={action.href} className="group">
                      <div className={cn(
                        "flex flex-col h-full justify-between p-8 rounded-[2.5rem] border transition-all duration-300",
                        action.primary 
                          ? 'bg-card border-primary/20 shadow-lg hover:shadow-primary/10 hover:border-primary/40' 
                          : 'bg-card border-border hover:bg-accent/50 hover:border-primary/20'
                      )}>
                        <div>
                          <div className={cn(
                            "p-4 w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform",
                            action.primary ? 'gemini-gradient text-white' : 'bg-secondary text-primary'
                          )}>
                            {action.icon}
                          </div>
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{action.title}</h3>
                          <p className="text-2xl font-black leading-tight mb-4">{action.label}</p>
                        </div>
                        <div className="flex items-center text-primary font-bold gap-2 group-hover:gap-4 transition-all mt-4">
                          Start now <ArrowRight size={18} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            </div>

            {/* Right Column: Mini Activity/Sidebar info */}
            <div className="space-y-8">
              <motion.section variants={itemVariants} className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm">
                    <Calendar size={18} />
                  </div>
                  Daily Goal
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{Math.min(100, (stats.lessonsCompleted || 0) * 20)}%</span>
                  </div>
                  <div className="h-4 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full gemini-gradient rounded-full" 
                      style={{ width: `${Math.min(100, (stats.lessonsCompleted || 0) * 20)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You've completed <b>{stats.lessonsCompleted || 0} lessons</b> today. Keep it up to maintain your <b>{stats.streakDays || 0} day streak!</b>
                  </p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="glass-card rounded-[2.5rem] p-8 overflow-hidden relative group cursor-pointer" onClick={() => setIsChatOpen(true)}>
                <div className="absolute top-0 right-0 w-32 h-32 gemini-gradient opacity-10 blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity" />
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Bot size={20} className="text-primary" />
                  Quick Chat
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Need a quick translation or grammar check? Just ask your AI tutor.
                </p>
                <div className="flex items-center gap-2 px-4 py-3 bg-background/50 border border-border rounded-xl text-muted-foreground text-sm">
                  Type something...
                </div>
              </motion.section>
            </div>
          </motion.div>
        </div>

        {/* Floating Quick Chat (Optional: Keep or redesign) */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-6 right-6 w-full max-w-[400px] z-50 px-4"
            >
              <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[500px]">
                <div className="p-6 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gemini-gradient flex items-center justify-center text-white">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">AI Assistant</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Online</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] px-4 py-3 rounded-2xl text-sm",
                        m.role === 'user' 
                          ? "bg-primary text-primary-foreground rounded-tr-none shadow-md" 
                          : "bg-secondary text-secondary-foreground rounded-tl-none"
                      )}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border bg-card">
                  <div className="relative">
                    <input 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask anything..."
                      className="w-full bg-secondary border-none rounded-2xl px-5 py-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isSubmitting}
                      className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
                    >
                      {isSubmitting ? <Spinner className="w-4 h-4" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 rounded-full gemini-gradient text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-40 group"
          >
            <Bot size={28} />
            <div className="absolute right-full mr-4 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
              Quick Help
            </div>
          </button>
        )}
      </div>
    </ProtectedRoute>
  )
}