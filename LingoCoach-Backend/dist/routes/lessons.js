"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../lib/database");
const router = (0, express_1.Router)();
exports.lessonRoutes = router;
// Get lessons
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { language = 'en', level = 'beginner', category } = req.query;
        const lessons = await database_1.prisma.lesson.findMany({
            where: {
                language: language,
                level: level,
                isActive: true,
                ...(category && { category: category })
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ lessons });
    }
    catch (error) {
        console.error('Get lessons error:', error);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});
// Get specific lesson
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const lesson = await database_1.prisma.lesson.findUnique({
            where: { id: req.params.id }
        });
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        res.json({ lesson });
    }
    catch (error) {
        console.error('Get lesson error:', error);
        res.status(500).json({ error: 'Failed to fetch lesson' });
    }
});
// Complete lesson
router.post('/complete', auth_1.authenticateToken, async (req, res) => {
    try {
        const { lessonId, score, timeSpent } = req.body;
        const userId = req.user.id;
        // Update user lesson
        const userLesson = await database_1.prisma.userLesson.upsert({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId
                }
            },
            update: {
                status: 'completed',
                score,
                completedAt: new Date()
            },
            create: {
                userId,
                lessonId,
                status: 'completed',
                score,
                completedAt: new Date()
            }
        });
        // Create learning progress record
        await database_1.prisma.learningProgress.create({
            data: {
                userId,
                language: 'en', // Get from lesson
                level: 'beginner', // Get from lesson
                score
            }
        });
        res.json({ success: true, userLesson });
    }
    catch (error) {
        console.error('Complete lesson error:', error);
        res.status(500).json({ error: 'Failed to complete lesson' });
    }
});
//# sourceMappingURL=lessons.js.map