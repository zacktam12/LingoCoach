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

export { router as dashboardRoutes }