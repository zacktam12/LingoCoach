'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import { BookOpen, MessageCircle, Mic, Trophy, Target, Calendar, TrendingUp, Sparkles, Send, Bot, User, ArrowRight, LayoutDashboard, Settings } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Spinner } from '@/components/ui/spinner'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardData()
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (data) {
      const stats = data.stats || {}
      const recommendations = data.recommendations || {}

      const welcomeMessages = [
        {
          id: 'welcome-1',
          role: 'assistant',
          content: "Welcome back! It's great to see you again. Ready to dive into your language learning journey?",
          type: 'text'
        },
        {
          id: 'stats-card',
          role: 'assistant',
          content: "Here's a quick look at your current progress:",
          type: 'stats',
          stats: [
            { icon: <BookOpen className="h-5 w-5" />, label: 'Lessons', value: stats.lessonsCompleted || 0, color: 'text-blue-500' },
            { icon: <MessageCircle className="h-5 w-5" />, label: 'Chats', value: stats.conversationsCount || 0, color: 'text-green-500' },
            { icon: <Trophy className="h-5 w-5" />, label: 'Points', value: stats.totalScore || 0, color: 'text-yellow-500' },
            { icon: <Calendar className="h-5 w-5" />, label: 'Streak', value: stats.streakDays || 0, color: 'text-orange-500' }
          ]
        }
      ]

      if (recommendations.recommendedLesson || recommendations.recommendedConversation) {
        welcomeMessages.push({
          id: 'recommendations',
          role: 'assistant',
          content: "I've picked out some great next steps for you. Which one would you like to start with?",
          type: 'actions',
          actions: [
            recommendations.recommendedLesson && {
              label: `Next Lesson: ${recommendations.recommendedLesson.title}`,
              href: `/lessons/${recommendations.recommendedLesson.id}`,
              icon: <BookOpen className="h-4 w-4" />,
              primary: true
            },
            recommendations.recommendedConversation && {
              label: `Chat in ${recommendations.recommendedConversation.language.toUpperCase()}`,
              href: `/conversations/new`,
              icon: <MessageCircle className="h-4 w-4" />,
              primary: false
            }
          ].filter(Boolean)
        })
      }

      setMessages(welcomeMessages)
    }
  }, [data])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 100 } },
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center">
          <Spinner className="h-12 w-12 text-primary animate-pulse" />
          <p className="mt-4 text-muted-foreground animate-pulse">Consulting your tutor...</p>
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Header Area */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20 ring-4 ring-background">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Coach</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Online & Ready
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/profile" className="p-2 rounded-full hover:bg-secondary/50 transition-colors">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Chat Container */}
          <motion.div 
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={msg.id} 
                  variants={messageVariants}
                  layout
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mb-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div className="max-w-[85%] md:max-w-[70%] space-y-2">
                    {msg.type === 'text' && (
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-br-none' 
                          : 'bg-card border border-border rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                    )}

                    {msg.type === 'stats' && (
                      <div className="bg-card border border-border p-5 rounded-2xl rounded-bl-none shadow-sm space-y-4">
                        <p className="text-sm font-medium mb-3">{msg.content}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {msg.stats.map((stat: any, sIdx: number) => (
                            <div key={sIdx} className="bg-secondary/30 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                              <div className={`${stat.color} p-2 bg-background rounded-lg shadow-sm`}>
                                {stat.icon}
                              </div>
                              <div>
                                <div className="text-xl font-bold leading-tight">{stat.value}</div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.type === 'actions' && (
                      <div className="space-y-3">
                        <div className="bg-card border border-border p-4 rounded-2xl rounded-bl-none shadow-sm italic text-muted-foreground text-sm">
                          {msg.content}
                        </div>
                        <div className="flex flex-col gap-2">
                          {msg.actions.map((action: any, aIdx: number) => (
                            <Link key={aIdx} href={action.href}>
                              <button className={`w-full group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                                action.primary 
                                  ? 'bg-primary text-primary-foreground border-primary hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5' 
                                  : 'bg-card text-foreground border-border hover:bg-secondary hover:border-primary/30'
                              }`}>
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${action.primary ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                    {action.icon}
                                  </div>
                                  <span className="font-semibold text-sm">{action.label}</span>
                                </div>
                                <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${action.primary ? 'text-white/70' : 'text-primary'}`} />
                              </button>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Quick Shortcuts Bar */}
          <motion.div 
            className="mt-16 pt-8 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Link href="/pronunciation" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform">
                <Mic className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold">Pronunciation</span>
            </Link>
            <Link href="/achievements" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group">
              <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-600 group-hover:scale-110 transition-transform">
                <Trophy className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold">Rewards</span>
            </Link>
            <Link href="/dashboard" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 transition-all shadow-sm group">
              <div className="p-3 rounded-xl bg-primary text-white group-hover:scale-110 transition-transform">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-primary">Overview</span>
            </Link>
            <Link href="/lessons" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold">Library</span>
            </Link>
          </motion.div>

        </div>

        {/* Input Bar - Persistent at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border">
          <div className="max-w-4xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Ask your coach anything..."
                className="w-full bg-secondary/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mic className="h-5 w-5" />
                </button>
              </div>
            </div>
            <button 
              className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              onClick={() => {
                if (inputValue.trim()) {
                  setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'user',
                    content: inputValue,
                    type: 'text'
                  }])
                  setInputValue('')
                  // Here we could simulate a bot response
                  setTimeout(() => {
                    setMessages(prev => [...prev, {
                      id: (Date.now() + 1).toString(),
                      role: 'assistant',
                      content: "I'm still learning how to chat here on the dashboard! For now, let's focus on your lessons or conversation practice.",
                      type: 'text'
                    }])
                  }, 1000)
                }
              }}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">By language</div>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        {analytics.languageStats.length > 0 ? (
                          analytics.languageStats.map((item: any) => {
                            const widthPercent = maxLanguageTime
                              ? Math.round(((item.totalTime || 0) / maxLanguageTime) * 100)
                              : 0
                            return (
                              <div key={item.language} className="space-y-1">
                                <div className="flex justify-between">
                                  <span>{item.language}</span>
                                  <span>
                                    {Math.round(item.totalTime || 0)} min  • {Math.round(item.averageScore || 0)}/100
                                  </span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className="h-2 bg-primary rounded-full"
                                    style={{ width: `${Math.min(100, Math.max(0, widthPercent))}%` }}
                                  ></div>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div>No language stats yet.</div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground border-t border-border pt-3 mt-2">
                      <div className="flex justify-between">
                        <span>Pronunciation (7 days)</span>
                        <span>
                          {analytics.pronunciationSummary.count} sessions  •{' '}
                          {Math.round(analytics.pronunciationSummary.averageScore || 0)}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}