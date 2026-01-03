'use client'

import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { Trophy, Star, Award, Target, BookOpen, MessageCircle, Mic } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Achievements() {
  const [userAchievements, setUserAchievements] = useState<any[]>([])
  const [allAchievements, setAllAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      const [userRes, allRes] = await Promise.all([
        dashboardAPI.getAchievements(),
        dashboardAPI.getAllAchievements()
      ])
      
      setUserAchievements(userRes.data.achievements)
      setAllAchievements(allRes.data.achievements)
    } catch (err) {
      setError('Failed to load achievements')
      console.error('Fetch achievements error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
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

  // Group achievements by category
  const achievementsByCategory = allAchievements.reduce((acc: any, achievement) => {
    const category = achievement.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(achievement)
    return acc
  }, {})

  // Get user achievement IDs for quick lookup
  const userAchievementIds = new Set(userAchievements.map(ua => ua.achievementId))

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Achievements</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Trophy className="h-10 w-10 mr-4" />
              <div>
                <p className="text-sm opacity-80">Total Achievements</p>
                <p className="text-2xl font-bold">{userAchievements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-10 w-10 mr-4" />
              <div>
                <p className="text-sm opacity-80">Points Earned</p>
                <p className="text-2xl font-bold">
                  {userAchievements.reduce((sum, ua) => sum + (ua.achievement.points || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-10 w-10 mr-4" />
              <div>
                <p className="text-sm opacity-80">Completion</p>
                <p className="text-2xl font-bold">
                  {allAchievements.length > 0 
                    ? Math.round((userAchievements.length / allAchievements.length) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Achievements by Category */}
      <div className="space-y-8">
        {Object.entries(achievementsByCategory).map(([category, achievements]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getCategoryIcon(category)}
                <span className="ml-2 capitalize">{category}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(achievements as any[]).map((achievement) => {
                  const isEarned = userAchievementIds.has(achievement.id)
                  const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id)
                  
                  return (
                    <Card 
                      key={achievement.id}
                      className={`border transition-all ${
                        isEarned 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : 'border-gray-200 dark:border-gray-700 opacity-70'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <div className={`p-2 rounded-lg mr-3 ${
                            isEarned 
                              ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          }`}>
                            <Trophy size={20} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">{achievement.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {achievement.description}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                {achievement.points} pts
                              </span>
                              {isEarned && userAchievement && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Earned {new Date(userAchievement.earnedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'lessons':
      return <BookOpen className="h-5 w-5 text-blue-500" />
    case 'conversations':
      return <MessageCircle className="h-5 w-5 text-green-500" />
    case 'pronunciation':
      return <Mic className="h-5 w-5 text-purple-500" />
    default:
      return <Award className="h-5 w-5 text-yellow-500" />
  }
}