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
  res.json({ status: 'Lessons service is running', timestamp: new Date().toISOString() })
})

// Get lessons
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { language = 'en', level = 'beginner', category } = req.query

    const lessons = await prisma.lesson.findMany({
      where: {
        language: language as string,
        level: level as string,
        isActive: true,
        ...(category && { category: category as string })
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ lessons })
  } catch (error) {
    console.error('Get lessons error:', error)
    res.status(500).json({ error: 'Failed to fetch lessons' })
  }
})

// Get specific lesson
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' })
    }

    res.json({ lesson })
  } catch (error) {
    console.error('Get lesson error:', error)
    res.status(500).json({ error: 'Failed to fetch lesson' })
  }
})

// Complete lesson
router.post('/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId, score, timeSpent } = req.body
    const userId = req.user!.id

    // Validate input
    if (!lessonId || score === undefined) {
      return res.status(400).json({ error: 'lessonId and score are required' })
    }

    // Get the lesson to retrieve language and level
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' })
    }

    // Update user lesson
    const userLesson = await prisma.userLesson.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      update: {
        status: 'completed',
        score,
        completedAt: new Date()
      },
      create: {
        userId,
        lessonId,
        status: 'completed',
        score,
        completedAt: new Date()
      }
    })

    // Create learning progress record
    await prisma.learningProgress.create({
      data: {
        userId,
        language: lesson.language,
        level: lesson.level,
        score
      }
    })

    res.json({ success: true, userLesson })
  } catch (error) {
    console.error('Complete lesson error:', error)
    res.status(500).json({ error: 'Failed to complete lesson' })
  }
})

export { router as lessonRoutes }