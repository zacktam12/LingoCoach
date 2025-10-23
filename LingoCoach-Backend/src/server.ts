import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { prisma } from './lib/database'
import { errorHandler } from './middleware/errorHandler'
import { authRoutes } from './routes/auth'
import { conversationRoutes } from './routes/conversations'
import { lessonRoutes } from './routes/lessons'
import { dashboardRoutes } from './routes/dashboard'
import { userRoutes } from './routes/users'

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

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', userRoutes)

// WebSocket for real-time conversations
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId)
    console.log(`User ${socket.id} joined conversation ${conversationId}`)
  })

  socket.on('send-message', async (data) => {
    try {
      // Process message with AI
      const response = await processMessageWithAI(data.message, data.language, data.level)
      
      // Broadcast to conversation room
      socket.to(data.conversationId).emit('ai-response', {
        message: response.content,
        suggestions: response.suggestions,
        grammarCorrections: response.grammarCorrections
      })
    } catch (error) {
      socket.emit('error', { message: 'Failed to process message' })
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
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
  console.log(`🚀 Backend server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  server.close(() => {
    console.log('Process terminated')
  })
})

// AI message processing function
async function processMessageWithAI(message: string, language: string, level: string) {
  // This would integrate with your AI service
  // For now, return a mock response
  return {
    content: `AI Response to: "${message}"`,
    suggestions: ['Try using more descriptive words', 'Consider the context'],
    grammarCorrections: []
  }
}
