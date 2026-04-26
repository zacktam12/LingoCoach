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

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'Pronunciation service is running', timestamp: new Date().toISOString() })
})

// Analyze pronunciation
router.post('/analyze', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { expectedText, transcription, language } = req.body
    const userId = req.user!.id

    if (!expectedText) {
      return res.status(400).json({ error: 'expectedText is required' })
    }

    if (!transcription) {
      return res.status(400).json({ error: 'transcription is required' })
    }

    // Validate language parameter
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt']
    if (language && !supportedLanguages.includes(language)) {
      return res.status(400).json({ error: 'Unsupported language' })
    }

    // Use AI backend to score the raw text comparison
    const analysisResult = await deepseek.analyzePronunciation(transcription, expectedText, language || 'en')
    
    // Save analysis to database without audioUrl (since it's done natively in frontend)
    const pronunciationAnalysis = await prisma.pronunciationAnalysis.create({
      data: {
        userId,
        text: expectedText,
        score: analysisResult.score,
        feedback: analysisResult.feedback,
        audioUrl: '' // Satisfy Prisma schema without storing an actual WebM blob
      }
    })

    res.json({
      analysis: pronunciationAnalysis,
      score: analysisResult.score,
      feedback: analysisResult.feedback
    })

  } catch (error: any) {
    console.error('Pronunciation analysis error:', error)
    res.status(500).json({ error: 'Failed to analyze pronunciation', details: error.message })
  }
})

// Generate practice phrase dynamically
router.get('/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { language } = req.query;
    
    // Validate language parameter
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt'];
    const langstr = typeof language === 'string' ? language : 'en';
    
    if (language && !supportedLanguages.includes(langstr)) {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    const phrase = await deepseek.generatePracticePhrase(langstr);
    res.json({ phrase });
  } catch (error) {
    console.error('Generate phrase error:', error);
    res.status(500).json({ error: 'Failed to generate practice phrase' });
  }
});

// Get user's pronunciation history
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    
    const analyses = await prisma.pronunciationAnalysis.findMany({
      where: { userId: userId },
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