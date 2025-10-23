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

export { router as dashboardRoutes }
