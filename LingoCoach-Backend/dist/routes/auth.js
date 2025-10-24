"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../lib/database");
const router = (0, express_1.Router)();
exports.authRoutes = router;
// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Check if user exists
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await database_1.prisma.user.create({
            data: {
                email,
                name,
                // Note: In a real app, you'd store hashedPassword in a separate field
            }
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // In a real app, you'd verify the password here
        // const isValidPassword = await bcrypt.compare(password, user.hashedPassword)
        // if (!isValidPassword) {
        //   return res.status(401).json({ error: 'Invalid credentials' })
        // }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// Get current user
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
//# sourceMappingURL=auth.js.map