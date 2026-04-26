import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import rateLimit from 'express-rate-limit'
import { prisma } from '../lib/database'

const router = Router()

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required(),
  name: Joi.string().min(1).max(100).allow(null, '')
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { id: userId, email, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  )
  return { accessToken, refreshToken }
}

// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body)

    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { email, password, name } = value

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { email, name: name || null, passwordHash: hashedPassword }
    })

    const { accessToken, refreshToken } = generateTokens(user.id, user.email)

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token: accessToken,
      refreshToken
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { email, password } = value

    const user = await prisma.user.findUnique({ where: { email } })

    // Constant-time comparison to prevent timing attacks
    const dummyHash = '$2a$12$dummyhashfordummycomparison000000000000000000000000000'
    const isValidPassword = user?.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false)

    if (!user || !isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email)

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token: accessToken,
      refreshToken
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' })
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!
    ) as { id: string; email: string; type: string }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email)
    res.json({ token: accessToken, refreshToken: newRefreshToken })
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
})

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true })
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, image: true, createdAt: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export { router as authRoutes }
