import { Router, Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth'
import { DeepSeekService } from '../services/ai'
import { prisma } from '../lib/database'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

const router = Router()
const deepseek = new DeepSeekService(process.env.DEEPSEEK_API_KEY!)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '-' + file.originalname)
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true)
    } else {
      cb(new Error('Only audio files are allowed'))
    }
  }
})

// Analyze pronunciation
router.post('/analyze', authenticateToken, upload.single('audio'), async (req: AuthRequest, res: Response) => {
  try {
    const { text, language } = req.body
    const userId = req.user!.id
    const audioFile = req.file

    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file is required' })
    }

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    // In a real implementation, we would:
    // 1. Use a speech-to-text service to transcribe the audio
    // 2. Compare the transcription with the provided text
    // 3. Use AI to analyze pronunciation accuracy
    
    // For now, we'll simulate the analysis
    const analysisResult = await deepseek.analyzePronunciation(text, language)
    
    // Save analysis to database
    const pronunciationAnalysis = await prisma.pronunciationAnalysis.create({
      data: {
        userId,
        audioUrl: audioFile.path,
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