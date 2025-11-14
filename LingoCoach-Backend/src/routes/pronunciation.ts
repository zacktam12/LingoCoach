import { Router, Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth'
import { DeepSeekService } from '../services/ai'
import { prisma } from '../lib/database'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

const router = Router()
const deepseek = new DeepSeekService(process.env.DEEPSEEK_API_KEY!)

// Analyze pronunciation
router.post('/analyze', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { audioUrl, text, language } = req.body
    const userId = req.user!.id

    // In a real implementation, we would:
    // 1. Download the audio file from audioUrl
    // 2. Use a speech-to-text service to transcribe the audio
    // 3. Compare the transcription with the provided text
    // 4. Use AI to analyze pronunciation accuracy
    
    // For now, we'll simulate the analysis
    const analysisResult = await deepseek.analyzePronunciation(text, language)
    
    // Save analysis to database
    const pronunciationAnalysis = await prisma.pronunciationAnalysis.create({
      data: {
        userId,
        audioUrl,
        text,
        score: analysisResult.score,
        feedback: analysisResult.feedback
      }
    })

    res.json({
      analysis: pronunciationAnalysis,
      score: analysisResult.score,
      feedback: analysisResult.feedback
    })

  } catch (error) {
    console.error('Pronunciation analysis error:', error)
    res.status(500).json({ error: 'Failed to analyze pronunciation' })
  }
})

// Get user's pronunciation history
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const analyses = await prisma.pronunciationAnalysis.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    res.json({ analyses })
  } catch (error) {
    console.error('Get pronunciation history error:', error)
    res.status(500).json({ error: 'Failed to fetch pronunciation history' })
  }
})

export { router as pronunciationRoutes }