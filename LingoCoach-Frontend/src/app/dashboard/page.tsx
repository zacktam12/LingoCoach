'use client'

import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { BookOpen, MessageCircle, Mic, Trophy, Target, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Learning Dashboard</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lessons Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.lessonsCompleted || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conversations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.conversationsCount || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg mr-4">
                  <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalScore || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg mr-4">
                  <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.streakDays || 0}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Learning Modules */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Learning Modules</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/lessons" className="block">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Lessons</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      Practice with structured lessons tailored to your level
                    </p>
                    <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                      Continue Learning →
                    </button>
                  </div>
                </Link>
                
                <Link href="/conversations" className="block">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                        <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Conversations</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      Practice speaking with AI conversation partners
                    </p>
                    <button className="text-green-600 dark:text-green-400 text-sm font-medium hover:underline">
                      Start Chatting →
                    </button>
                  </div>
                </Link>
                
                <Link href="/pronunciation" className="block">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
                        <Mic className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Pronunciation</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      Improve your speaking skills with pronunciation practice
                    </p>
                    <button className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:underline">
                      Practice Now →
                    </button>
                  </div>
                </Link>
                
                <Link href="/achievements" className="block">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg mr-3">
                        <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Achievements</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      Track your progress and earn badges
                    </p>
                    <button className="text-yellow-600 dark:text-yellow-400 text-sm font-medium hover:underline">
                      View Badges →
                    </button>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Progress Overview */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Progress Overview</h2>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Weekly Goal</h3>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>15 of 30 minutes</span>
                    <span>50%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Today</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">15 minutes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Yesterday</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">22 minutes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">2 days ago</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">8 minutes</p>
                    </div>
                  </div>
                </div>
                
                <button className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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