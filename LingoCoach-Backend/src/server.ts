import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import fs from 'fs'
import { prisma } from './lib/database'
import { logger } from './lib/logger'
import { errorHandler } from './middleware/errorHandler'
import { authRoutes } from './routes/auth'
import { conversationRoutes } from './routes/conversations'
import { lessonRoutes } from './routes/lessons'
import { dashboardRoutes } from './routes/dashboard'
import { userRoutes } from './routes/users'
import { pronunciationRoutes } from './routes/pronunciation'
import { practiceRoutes } from './routes/practice'
import { DeepSeekService } from './services/ai'

dotenv.config()

const app = express()

const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 3001

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Apply rate limiting to API routes
app.use('/api', apiLimiter)

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Aggregated health check
app.get('/health/full', async (req, res) => {
  const timestamp = new Date().toISOString()

  let dbStatus: 'up' | 'down' = 'up'
  let dbError: string | undefined

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error: any) {
    dbStatus = 'down'
    dbError = error?.message || 'Unknown error'
    logger.error('Database health check failed', error)
  }

  const aiConfigured = Boolean(process.env.DEEPSEEK_API_KEY)
  const uploadsExists = fs.existsSync(uploadsDir)

  const overallStatus = dbStatus === 'up' ? 'OK' : 'DEGRADED'
  const statusCode = dbStatus === 'up' ? 200 : 503

  res.status(statusCode).json({
    status: overallStatus,
    timestamp,
    checks: {
      database: {
        status: dbStatus,
        error: dbError,
      },
      ai: {
        configured: aiConfigured,
      },
      uploads: {
        exists: uploadsExists,
      },
    },
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', userRoutes)
app.use('/api/pronunciation', pronunciationRoutes)
app.use('/api/practice', practiceRoutes)

// Initialize AI service for WebSocket conversations
const deepseek = new DeepSeekService(process.env.DEEPSEEK_API_KEY!)

// WebSocket for real-time conversations
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id })

  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId)
    logger.info('User joined conversation', { socketId: socket.id, conversationId })
  })

  socket.on('send-message', async (data) => {
    try {
      const { conversationId, message, language, level } = data || {}

      if (!conversationId || !message) {
        socket.emit('error', { message: 'conversationId and message are required' })
        return
      }

      // Process message with AI
      const response = await processMessageWithAI(message, language, level)

      const newMessages = [
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response.content, timestamp: new Date() }
      ]

      // Persist messages to the conversation history
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messages: {
            push: newMessages
          },
          updatedAt: new Date()
        }
      })

      // Broadcast AI response to everyone in the room (including sender)
      io.to(conversationId).emit('ai-response', {
        message: response.content,
        suggestions: response.suggestions,
        grammarCorrections: response.grammarCorrections
      })
    } catch (error) {
      logger.error('WebSocket send-message error', { error })
      socket.emit('error', { message: 'Failed to process message' })
    }
  })

  socket.on('disconnect', () => {
    logger.info('User disconnected', { socketId: socket.id })
  })
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
server.listen(PORT, () => {
  logger.info('Backend server started', { port: PORT })
  logger.info('Health check endpoint', { url: `/health` })
  logger.info('API base URL', { url: `/api` })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  server.close(() => {
    logger.info('Process terminated')
  })
})

// AI message processing function using DeepSeekService
async function processMessageWithAI(message: string, language?: string, level?: string) {
  const aiResponse = await deepseek.generateConversation(
    [{ role: 'user', content: message }],
    { language: language || 'en', level: level || 'beginner' }
  )

  return {
    content: aiResponse.content,
    suggestions: aiResponse.suggestions || [],
    grammarCorrections: aiResponse.grammarCorrections || []
  }
}