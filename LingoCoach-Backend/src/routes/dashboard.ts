import { Router, Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth'
import { prisma } from '../lib/database'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

const router = Router()

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'Dashboard service is running', timestamp: new Date().toISOString() })
})

// Get dashboard stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const [
      lessonsCompleted,
      conversationsCount,
      totalScore,
      lastActivity,
      pronunciationCount,
      weeklyGoal,
      weeklyProgress,
      avgScore
    ] = await Promise.all([
      prisma.userLesson.count({
        where: {
          userId,
          status: 'completed'
        }
      }),
      prisma.conversation.count({
        where: { userId }
      }),
      prisma.learningProgress.aggregate({
        where: { userId },
        _sum: { score: true }
      }),
      prisma.learningProgress.findFirst({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true }
      }),
      prisma.pronunciationAnalysis.count({
        where: { userId }
      }),
      prisma.userPreferences.findFirst({
        where: { userId },
        select: { dailyGoal: true }
      }),
      prisma.learningProgress.count({
        where: {
          userId,
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.learningProgress.aggregate({
        where: { userId },
        _avg: { score: true }
      })
    ])
    
    // Calculate time spent separately
    const allProgress = await prisma.learningProgress.findMany({
      where: { userId }
    })


    // Calculate streak days (simplified)
    const streakDays = lastActivity 
      ? Math.max(0, Math.floor((new Date().getTime() - lastActivity.completedAt.getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    res.json({
      lessonsCompleted,
      conversationsCount,
      pronunciationCount,
      streakDays,
      totalScore: totalScore._sum.score || 0,
      averageScore: avgScore._avg.score || 0,
      timeSpent: 0, // Temporarily disabled due to type issues
      weeklyGoal: weeklyGoal?.dailyGoal || 15,
      weeklyProgress
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

// Get learning progress
router.get('/progress', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const progress = await prisma.learningProgress.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 10
    })

    res.json({ progress })
  } catch (error) {
    console.error('Get progress error:', error)
    res.status(500).json({ error: 'Failed to fetch progress' })
  }
})

router.get('/analytics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 6)

    const [progressEntries, pronunciationEntries] = await Promise.all([
      prisma.learningProgress.findMany({
        where: {
          userId,
          completedAt: {
            gte: startDate,
          },
        },
        orderBy: { completedAt: 'asc' },
      }),
      prisma.pronunciationAnalysis.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const dailyMap: Record<string, { date: string; totalScore: number; totalTime: number; count: number }> = {}

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const key = date.toISOString().slice(0, 10)
      dailyMap[key] = {
        date: key,
        totalScore: 0,
        totalTime: 0,
        count: 0,
      }
    }

    for (const entry of progressEntries) {
      const date = new Date(entry.completedAt)
      date.setHours(0, 0, 0, 0)
      const key = date.toISOString().slice(0, 10)
      if (dailyMap[key]) {
        dailyMap[key].totalScore += entry.score
        dailyMap[key].totalTime += 0 // Temporarily disabled due to type issues
        dailyMap[key].count += 1
      }
    }

    const languageStatsMap: Record<string, { language: string; count: number; totalScore: number; totalTime: number; averageScore: number; averageTime: number }> = {}

    for (const entry of progressEntries) {
      const language = entry.language
      if (!languageStatsMap[language]) {
        languageStatsMap[language] = {
          language,
          count: 0,
          totalScore: 0,
          totalTime: 0,
          averageScore: 0,
          averageTime: 0,
        }
      }
      languageStatsMap[language].count += 1
      languageStatsMap[language].totalScore += entry.score
      languageStatsMap[language].totalTime += 0 // Temporarily disabled due to type issues
    }

    Object.values(languageStatsMap).forEach((item) => {
      item.averageScore = item.count > 0 ? item.totalScore / item.count : 0
      item.averageTime = item.count > 0 ? item.totalTime / item.count : 0
    })

    let pronunciationTotalScore = 0

    for (const entry of pronunciationEntries) {
      pronunciationTotalScore += entry.score
    }

    const pronunciationSummary = {
      count: pronunciationEntries.length,
      averageScore: pronunciationEntries.length > 0 ? pronunciationTotalScore / pronunciationEntries.length : 0,
    }

    res.json({
      dailyScores: Object.values(dailyMap),
      languageStats: Object.values(languageStatsMap),
      pronunciationSummary,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// Get comprehensive analytics for enhanced dashboard
router.get('/comprehensive-analytics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    // Get user preferences
    const userPrefs = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    // Define date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Fetch data for different time periods
    const [
      todayProgress,
      weekProgress,
      monthProgress,
      overallProgress,
      todayLessons,
      weekLessons,
      monthLessons,
      overallLessons,
      todayConversations,
      weekConversations,
      monthConversations,
      overallConversations,
      todayPronunciations,
      weekPronunciations,
      monthPronunciations,
      overallPronunciations,
      skillLevels,
      weeklyComparison,
      monthlyComparison
    ] = await Promise.all([
      // Daily progress
      prisma.learningProgress.findMany({
        where: { userId, completedAt: { gte: today } },
      }),
      prisma.learningProgress.findMany({
        where: { userId, completedAt: { gte: weekStart } },
      }),
      prisma.learningProgress.findMany({
        where: { userId, completedAt: { gte: monthStart } },
      }),
      prisma.learningProgress.findMany({ where: { userId } }),
      
      // Lesson completions
      prisma.userLesson.count({
        where: { userId, completedAt: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } }
      }),
      prisma.userLesson.count({
        where: { userId, completedAt: { gte: weekStart } }
      }),
      prisma.userLesson.count({
        where: { userId, completedAt: { gte: monthStart } }
      }),
      prisma.userLesson.count({ where: { userId, status: 'completed' } }),
      
      // Conversations
      prisma.conversation.count({
        where: { userId, createdAt: { gte: today } }
      }),
      prisma.conversation.count({
        where: { userId, createdAt: { gte: weekStart } }
      }),
      prisma.conversation.count({
        where: { userId, createdAt: { gte: monthStart } }
      }),
      prisma.conversation.count({ where: { userId } }),
      
      // Pronunciation analyses
      prisma.pronunciationAnalysis.count({
        where: { userId, createdAt: { gte: today } }
      }),
      prisma.pronunciationAnalysis.count({
        where: { userId, createdAt: { gte: weekStart } }
      }),
      prisma.pronunciationAnalysis.count({
        where: { userId, createdAt: { gte: monthStart } }
      }),
      prisma.pronunciationAnalysis.count({ where: { userId } }),
      
      // Skill levels by language
      prisma.learningProgress.groupBy({
        by: ['language'],
        where: { userId },
        _avg: { score: true },
        _count: { score: true },
      }),
      
      // Weekly comparison (vs previous week)
      (async () => {
        const prevWeekStart = new Date(weekStart)
        prevWeekStart.setDate(weekStart.getDate() - 7)
        const prevWeekEnd = new Date(weekStart)
        
        const [prevWeekData, currWeekData] = await Promise.all([
          prisma.learningProgress.aggregate({
            where: {
              userId,
              completedAt: { gte: prevWeekStart, lt: weekStart }
            },
            _avg: { score: true },
            _count: { id: true }
          }),
          prisma.learningProgress.aggregate({
            where: {
              userId,
              completedAt: { gte: weekStart, lt: today }
            },
            _avg: { score: true },
            _count: { id: true }
          })
        ])
        
        return {
          previous: {
            avgScore: prevWeekData._avg.score || 0,
            totalTime: 0,
            activities: prevWeekData._count.id || 0
          },
          current: {
            avgScore: currWeekData._avg.score || 0,
            totalTime: 0,
            activities: currWeekData._count.id || 0
          }
        }
      })(),
      
      // Monthly comparison (vs previous month)
      (async () => {
        const prevMonthStart = new Date(monthStart)
        prevMonthStart.setMonth(monthStart.getMonth() - 1)
        const prevMonthEnd = new Date(monthStart)
        
        const [prevMonthData, currMonthData] = await Promise.all([
          prisma.learningProgress.aggregate({
            where: {
              userId,
              completedAt: { gte: prevMonthStart, lt: monthStart }
            },
            _avg: { score: true },
            _count: { id: true }
          }),
          prisma.learningProgress.aggregate({
            where: {
              userId,
              completedAt: { gte: monthStart }
            },
            _avg: { score: true },
            _count: { id: true }
          })
        ])
        
        return {
          previous: {
            avgScore: prevMonthData._avg.score || 0,
            totalTime: 0,
            activities: prevMonthData._count.id || 0
          },
          current: {
            avgScore: currMonthData._avg.score || 0,
            totalTime: 0,
            activities: currMonthData._count.id || 0
          }
        }
      })()
    ])

    // Calculate weekly and monthly trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const weeklyTrend = {
      score: calculateTrend(weeklyComparison.current.avgScore, weeklyComparison.previous.avgScore),
      time: calculateTrend(weeklyComparison.current.totalTime, weeklyComparison.previous.totalTime),
      activities: calculateTrend(weeklyComparison.current.activities, weeklyComparison.previous.activities)
    }

    const monthlyTrend = {
      score: calculateTrend(monthlyComparison.current.avgScore, monthlyComparison.previous.avgScore),
      time: calculateTrend(monthlyComparison.current.totalTime, monthlyComparison.previous.totalTime),
      activities: calculateTrend(monthlyComparison.current.activities, monthlyComparison.previous.activities)
    }

    res.json({
      // Basic stats
      dailyStats: {
        lessons: todayLessons,
        conversations: todayConversations,
        pronunciations: todayPronunciations,
        score: todayProgress.reduce((sum, p) => sum + p.score, 0),
        timeSpent: 0 // Temporarily disabled due to type issues
      },
      weeklyStats: {
        lessons: weekLessons,
        conversations: weekConversations,
        pronunciations: weekPronunciations,
        score: weekProgress.reduce((sum, p) => sum + p.score, 0),
        timeSpent: 0 // Temporarily disabled due to type issues
      },
      monthlyStats: {
        lessons: monthLessons,
        conversations: monthConversations,
        pronunciations: monthPronunciations,
        score: monthProgress.reduce((sum, p) => sum + p.score, 0),
        timeSpent: 0 // Temporarily disabled due to type issues
      },
      overallStats: {
        lessons: overallLessons,
        conversations: overallConversations,
        pronunciations: overallPronunciations,
        score: overallProgress.reduce((sum, p) => sum + p.score, 0),
        timeSpent: 0 // Temporarily disabled due to type issues
      },
      
      // Skill levels
      skillLevels: skillLevels.map(level => ({
        language: level.language,
        averageScore: level._avg.score || 0,
        activities: level._count.score || 0
      })),
      
      // Trends
      trends: {
        weekly: weeklyTrend,
        monthly: monthlyTrend
      },
      
      // Comparisons
      comparisons: {
        weekly: weeklyComparison,
        monthly: monthlyComparison
      },
      
      // Goals
      goals: {
        daily: userPrefs?.dailyGoal || 15,
        weekly: (userPrefs?.dailyGoal || 15) * 7,
        weeklyProgress: 0 // Temporarily disabled due to type issues
      }
    })
  } catch (error) {
    console.error('Get comprehensive analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch comprehensive analytics' })
  }
})

// Get user achievements
router.get('/achievements', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: { earnedAt: 'desc' }
    })

    res.json({ achievements })
  } catch (error) {
    console.error('Get achievements error:', error)
    res.status(500).json({ error: 'Failed to fetch achievements' })
  }
})

// Get all available achievements
router.get('/achievements/all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { points: 'desc' }
    })

    res.json({ achievements })
  } catch (error) {
    console.error('Get all achievements error:', error)
    res.status(500).json({ error: 'Failed to fetch achievements' })
  }
})

// Get personalized recommendations for the user
router.get('/recommendations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    
    // Get user's preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true
      }
    })
    
    const targetLanguage = user?.preferences?.targetLanguage || 'en'
    const learningLevel = user?.preferences?.learningLevel || 'beginner'
    
    // Get user's recent activity
    const [recentLessons, recentConversations] = await Promise.all([
      prisma.userLesson.findMany({
        where: { userId },
        include: { lesson: true },
        orderBy: { completedAt: 'desc' },
        take: 5
      }),
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])
    
    // Find next recommended lesson based on user's progress
    let recommendedLesson = null
    
    // Get lessons that the user hasn't completed yet
    const allLessons = await prisma.lesson.findMany({
      where: {
        language: targetLanguage,
        level: learningLevel,
      },
      orderBy: { createdAt: 'asc' }
    })
    
    const completedLessonIds = new Set(recentLessons.map(l => l.lessonId))
    const nextLesson = allLessons.find(lesson => !completedLessonIds.has(lesson.id))
    
    if (nextLesson) {
      recommendedLesson = {
        id: nextLesson.id,
        title: nextLesson.title,
        language: nextLesson.language,
        level: nextLesson.level,
        description: nextLesson.description
      }
    }
    
    // Find recommended conversation topic
    const recommendedConversation = {
      language: targetLanguage,
      level: learningLevel,
      suggestedTopic: 'Daily conversation practice', // This could be personalized based on user interests
    }
    
    res.json({
      recommendedLesson,
      recommendedConversation
    })
    
  } catch (error) {
    console.error('Get recommendations error:', error)
    res.status(500).json({ error: 'Failed to fetch recommendations' })
  }
})

export { router as dashboardRoutes }