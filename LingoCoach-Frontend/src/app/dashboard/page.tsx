'use client'

import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { BookOpen, MessageCircle, Mic, Trophy, Target, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Spinner } from '@/components/ui/spinner'
import { StatCard } from '@/components/ui/StatCard'
import { ModuleCard } from '@/components/ui/ModuleCard'
import { ProgressItem } from '@/components/ui/ProgressItem'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await dashboardAPI.getStats()
      setStats(response.data)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Fetch dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-foreground mb-8">Learning Dashboard</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<BookOpen className="h-6 w-6 text-primary" />} title="Lessons Completed" value={stats?.lessonsCompleted || 0} />
            <StatCard icon={<MessageCircle className="h-6 w-6 text-primary" />} title="Conversations" value={stats?.conversationsCount || 0} />
            <StatCard icon={<Trophy className="h-6 w-6 text-primary" />} title="Total Points" value={stats?.totalScore || 0} />
            <StatCard icon={<Calendar className="h-6 w-6 text-primary" />} title="Day Streak" value={stats?.streakDays || 0} />
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Learning Modules */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-foreground mb-4">Learning Modules</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ModuleCard icon={<BookOpen className="h-5 w-5 text-primary" />} title="Lessons" description="Practice with structured lessons tailored to your level" href="/lessons" />
                <ModuleCard icon={<MessageCircle className="h-5 w-5 text-primary" />} title="Conversations" description="Practice speaking with AI conversation partners" href="/conversations" />
                <ModuleCard icon={<Mic className="h-5 w-5 text-primary" />} title="Pronunciation" description="Improve your speaking skills with pronunciation practice" href="/pronunciation" />
                <ModuleCard icon={<Trophy className="h-5 w-5 text-primary" />} title="Achievements" description="Track your progress and earn badges" href="/achievements" />
              </div>
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
                    <span>15 of 30 minutes</span>
                    <span>50%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <ProgressItem title="Today" value="15 minutes" active />
                  <ProgressItem title="Yesterday" value="22 minutes" />
                  <ProgressItem title="2 days ago" value="8 minutes" />
                </div>
                
                <button className="w-full mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  Set Daily Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}