'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import { BookOpen, MessageCircle, Mic, Trophy, Target, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Spinner } from '@/components/ui/spinner'
import { StatCard } from '@/components/ui/StatCard'
import { ModuleCard } from '@/components/ui/ModuleCard'
import { ProgressItem } from '@/components/ui/ProgressItem'
import { motion, useReducedMotion } from 'framer-motion'

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardData()

  const shouldReduceMotion = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.04,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  }

  const motionListProps = shouldReduceMotion
    ? {}
    : { initial: 'hidden' as const, animate: 'visible' as const }

  const stats = data?.stats || null
  const progress = data?.progress || []
  const analytics = data?.analytics || null
  const recommendations = data?.recommendations || null

  const lessonsGoal = 10
  const lessonsCompleted = stats?.lessonsCompleted || 0
  const goalPercent = Math.min(100, Math.round((lessonsCompleted / lessonsGoal) * 100))
  const maxDailyScore =
    (analytics?.dailyScores && analytics.dailyScores.length > 0
      ? Math.max(...analytics.dailyScores.map((d: any) => d.totalScore || 0))
      : 0) || 0
  const maxLanguageTime =
    (analytics?.languageStats && analytics.languageStats.length > 0
      ? Math.max(...analytics.languageStats.map((l: any) => l.totalTime || 0))
      : 0) || 0

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner className="h-12 w-12 text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
        Failed to load dashboard data
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Learning Dashboard</h1>
          
          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={containerVariants}
            {...motionListProps}
          >
            <motion.div variants={itemVariants}>
              <StatCard icon={<BookOpen className="h-6 w-6 text-primary" />} title="Lessons Completed" value={stats?.lessonsCompleted || 0} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard icon={<MessageCircle className="h-6 w-6 text-primary" />} title="Conversations" value={stats?.conversationsCount || 0} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard icon={<Trophy className="h-6 w-6 text-primary" />} title="Total Points" value={stats?.totalScore || 0} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard icon={<Calendar className="h-6 w-6 text-primary" />} title="Day Streak" value={stats?.streakDays || 0} />
            </motion.div>
          </motion.div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Learning Modules */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Learning Modules</h2>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  variants={containerVariants}
                  {...motionListProps}
                >
                  <motion.div variants={itemVariants}>
                    <ModuleCard icon={<BookOpen className="h-5 w-5 text-primary" />} title="Lessons" description="Practice with structured lessons tailored to your level" href="/lessons" />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModuleCard icon={<MessageCircle className="h-5 w-5 text-primary" />} title="Conversations" description="Practice speaking with AI conversation partners" href="/conversations" />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModuleCard icon={<Mic className="h-5 w-5 text-primary" />} title="Pronunciation" description="Improve your speaking skills with pronunciation practice" href="/pronunciation" />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModuleCard icon={<Trophy className="h-5 w-5 text-primary" />} title="Achievements" description="Track your progress and earn badges" href="/achievements" />
                  </motion.div>
                </motion.div>
              </div>

              {recommendations && (
                <div className="bg-card rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Recommended Next Steps</h3>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    {recommendations.recommendedLesson && (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">Next Lesson</div>
                          <div>{recommendations.recommendedLesson.title}</div>
                          <div className="text-xs">
                            {recommendations.recommendedLesson.language} • {recommendations.recommendedLesson.level}
                          </div>
                        </div>
                        <Link
                          href={`/lessons/${recommendations.recommendedLesson.id}`}
                          className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Start
                        </Link>
                      </div>
                    )}

                    {recommendations.recommendedConversation && (
                      <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
                        <div>
                          <div className="font-medium text-foreground">Suggested Conversation</div>
                          <div>
                            {recommendations.recommendedConversation.language.toUpperCase()} •{' '}
                            {recommendations.recommendedConversation.level}
                          </div>
                          <div className="text-xs">
                            Topic: {recommendations.recommendedConversation.suggestedTopic}
                          </div>
                        </div>
                        <Link
                          href="/conversations/new"
                          className="px-3 py-1 text-xs rounded-md bg-secondary text-foreground hover:bg-secondary/80"
                        >
                          Start
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress Overview */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Progress Overview</h2>
              
              <div className="bg-card rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-medium text-foreground">Weekly Goal</h3>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>{lessonsCompleted} of {lessonsGoal} lessons</span>
                    <span>{goalPercent}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${goalPercent}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {progress.length > 0 ? (
                    progress.map((item: any, index: number) => {
                      const date = item.completedAt ? new Date(item.completedAt) : null
                      const dateLabel = date ? date.toLocaleDateString() : ''
                      const title = `${item.language} • ${item.level}`
                      const value = `Score: ${Math.round(item.score)}${dateLabel ? ` • ${dateLabel}` : ''}`

                      return (
                        <ProgressItem
                          key={item.id || item.completedAt || index}
                          title={title}
                          value={value}
                          active={index === 0}
                        />
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Complete a lesson to see your recent progress here.
                    </p>
                  )}
                </div>
                
                <button className="w-full mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  Set Daily Goal
                </button>
              </div>

              {analytics && (
                <div className="mt-6 bg-card rounded-xl shadow-lg p-6">
                  <h3 className="font-medium text-foreground mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 text-primary mr-2" />
                    Weekly Trends
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Scores last 7 days</div>
                      <div className="space-y-2">
                        {analytics.dailyScores.map((day: any) => {
                          const date = day.date ? new Date(day.date) : null
                          const dateLabel = date ? date.toLocaleDateString() : ''
                          const widthPercent = maxDailyScore
                            ? Math.round(((day.totalScore || 0) / maxDailyScore) * 100)
                            : 0
                          return (
                            <div key={day.date} className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="w-16 truncate">{dateLabel}</span>
                              <div className="flex-1 mx-2 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-2 bg-primary rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(0, widthPercent))}%` }}
                                ></div>
                              </div>
                              <span className="w-10 text-right">{Math.round(day.totalScore || 0)}</span>
                            </div>
                          )
                        })}
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