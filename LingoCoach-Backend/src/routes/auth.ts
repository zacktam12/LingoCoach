import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import { prisma } from '../lib/database'

const router = Router()

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().max(100).allow(null, '')
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

// Register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body)

    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { email, password, name } = value

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword
      }
    })

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body)

    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { email, password } = value

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Logout (JWT-based, stateless)
router.post('/logout', (req, res) => {
  // With JWT auth there is no server-side session to destroy.
  // The client should remove the token from storage.
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
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })

  } catch (error) {
    console.error('Get user error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
})

export { router as authRoutes }
