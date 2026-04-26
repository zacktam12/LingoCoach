import { Router, Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth'
import { prisma } from '../lib/database'
import { DeepSeekService } from '../services/ai'

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

// Get lessons with pagination
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { language, level, category } = req.query
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20)
    const skip = (page - 1) * limit

    const where = {
      isActive: true,
      ...(language && { language: language as string }),
      ...(level && { level: level as string }),
      ...(category && { category: category as string }),
    }

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.lesson.count({ where })
    ])

    res.json({
      lessons,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
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
        score,
        timeSpent: typeof timeSpent === 'number' ? timeSpent : null
      }
    })

    res.json({ success: true, userLesson })
  } catch (error) {
    console.error('Complete lesson error:', error)
    res.status(500).json({ error: 'Failed to complete lesson' })
  }
})

// Create lesson manually
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, content, language, level, category, duration } = req.body

    if (!title || !content || !language || !level || !category) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        content,
        language,
        level,
        category,
        duration: duration || 10,
        isActive: true
      }
    })

    res.json({ success: true, lesson })
  } catch (error) {
    console.error('Create lesson error:', error)
    res.status(500).json({ error: 'Failed to create lesson' })
  }
})

// Generate lesson with AI
router.post('/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { topic, language, level, category } = req.body

    if (!topic || !language || !level || !category) {
      return res.status(400).json({ error: 'Missing parameters for generation' })
    }

    const aiService = new DeepSeekService(process.env.GROQ_API_KEY!)
    const generatedData = await aiService.generateLesson(topic, language, level, category)

    const lesson = await prisma.lesson.create({
      data: {
        title: generatedData.title || `${topic} Lesson`,
        description: generatedData.description || `AI generated lesson about ${topic}`,
        content: generatedData.content,
        language,
        level,
        category,
        duration: generatedData.duration || 10,
        isActive: true
      }
    })

    res.json({ success: true, lesson })
  } catch (error) {
    console.error('Generate lesson AI error:', error)
    res.status(500).json({ error: 'Failed to generate lesson via AI' })
  }
})

export { router as lessonRoutes }