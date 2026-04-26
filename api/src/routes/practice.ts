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

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'Practice service is running', timestamp: new Date().toISOString() })
})

// List practice sentences for current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const sentences = await prisma.practiceSentence.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ sentences })
  } catch (error) {
    console.error('Get practice sentences error:', error)
    res.status(500).json({ error: 'Failed to fetch practice sentences' })
  }
})

// Create a new practice sentence
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { text, language, level } = req.body || {}

    if (!text || !language) {
      return res.status(400).json({ error: 'Text and language are required' })
    }

    const sentence = await prisma.practiceSentence.create({
      data: {
        userId,
        text,
        language,
        level: level || null,
      },
    })

    res.status(201).json({ sentence })
  } catch (error) {
    console.error('Create practice sentence error:', error)
    res.status(500).json({ error: 'Failed to create practice sentence' })
  }
})

// Delete a practice sentence
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    await prisma.practiceSentence.deleteMany({
      where: {
        id,
        userId,
      },
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete practice sentence error:', error)
    res.status(500).json({ error: 'Failed to delete practice sentence' })
  }
})

export { router as practiceRoutes }
