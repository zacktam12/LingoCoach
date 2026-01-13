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
  res.json({ status: 'Conversations service is running', timestamp: new Date().toISOString() })
})

// Send message to AI
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { message, conversationId, language, level } = req.body
    const userId = req.user!.id

    // Validate input
    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Generate AI response
    const aiResponse = await deepseek.generateConversation(
      [{ role: 'user', content: message }],
      { language: language || 'en', level: level || 'beginner' }
    )

    const newMessages = [
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: aiResponse.content, timestamp: new Date() }
    ]

    let conversation

    if (conversationId) {
      // Append to existing conversation
      conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messages: {
            push: newMessages
          },
          updatedAt: new Date()
        }
      })
    } else {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          userId,
          language: language || 'en',
          level: level || 'beginner',
          messages: newMessages
        }
      })
    }

    res.json({
      message: aiResponse.content,
      suggestions: aiResponse.suggestions,
      grammarCorrections: aiResponse.grammarCorrections,
      conversationId: conversation.id
    })

  } catch (error) {
    console.error('Conversation error:', error)
    res.status(500).json({ error: 'Failed to process conversation' })
  }
})

// Get user conversations
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        language: true,
        level: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json({ conversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

// Get specific conversation
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    res.json({ conversation })
  } catch (error) {
    console.error('Get conversation error:', error)
    res.status(500).json({ error: 'Failed to fetch conversation' })
  }
})

// Delete conversation
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.conversation.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete conversation error:', error)
    res.status(500).json({ error: 'Failed to delete conversation' })
  }
})

// Text-to-speech for AI responses
router.post('/speak', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { text, language = 'en-US' } = req.body;
    const userId = req.user!.id;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Convert language to proper format if needed
    const languageCode = deepseek.convertLanguageToISO(language);
    
    // Generate speech
    const audioBuffer = await deepseek.synthesizeSpeechBuffer(text, languageCode);
    
    // Set appropriate headers for audio streaming
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Content-Disposition': 'inline',
    });
    
    res.send(audioBuffer);
    
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

export { router as conversationRoutes }