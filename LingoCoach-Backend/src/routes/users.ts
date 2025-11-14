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

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { name, image } = req.body

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(image && { image })
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        updatedAt: true
      }
    })

    res.json({ user })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Get user preferences
router.get('/preferences', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    })

    res.json({ preferences })
  } catch (error) {
    console.error('Get preferences error:', error)
    res.status(500).json({ error: 'Failed to fetch preferences' })
  }
})

// Update user preferences
router.put('/preferences', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { language, targetLanguage, learningLevel, dailyGoal, notifications, privacy } = req.body

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        ...(language && { language }),
        ...(targetLanguage && { targetLanguage }),
        ...(learningLevel && { learningLevel }),
        ...(dailyGoal && { dailyGoal }),
        ...(notifications && { notifications }),
        ...(privacy && { privacy }),
        updatedAt: new Date()
      },
      create: {
        userId,
        language: language || 'en',
        targetLanguage: targetLanguage || 'es',
        learningLevel: learningLevel || 'beginner',
        dailyGoal: dailyGoal || 15,
        notifications: notifications || {},
        privacy: privacy || {}
      }
    })

    res.json({ preferences })
  } catch (error) {
    console.error('Update preferences error:', error)
    res.status(500).json({ error: 'Failed to update preferences' })
  }
})

export { router as userRoutes }