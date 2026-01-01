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
      lastActivity
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
      })
    ])

    // Calculate streak days (simplified)
    const streakDays = lastActivity 
      ? Math.max(0, Math.floor((Date.now() - lastActivity.completedAt.getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    res.json({
      lessonsCompleted,
      conversationsCount,
      streakDays,
      totalScore: totalScore._sum.score || 0
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
        dailyMap[key].totalTime += entry.timeSpent ?? 0
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
      languageStatsMap[language].totalTime += entry.timeSpent ?? 0
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
      select: {
        targetLanguage: true,
        learningLevel: true,
        preferences: true
      }
    })
    
    const targetLanguage = user?.targetLanguage || 'en'
    const learningLevel = user?.learningLevel || 'beginner'
    
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
      orderBy: { order: 'asc' }
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