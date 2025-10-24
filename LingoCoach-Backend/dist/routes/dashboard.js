"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../lib/database");
const router = (0, express_1.Router)();
exports.dashboardRoutes = router;
// Get dashboard stats
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [lessonsCompleted, conversationsCount, totalScore, lastActivity] = await Promise.all([
            database_1.prisma.userLesson.count({
                where: {
                    userId,
                    status: 'completed'
                }
            }),
            database_1.prisma.conversation.count({
                where: { userId }
            }),
            database_1.prisma.learningProgress.aggregate({
                where: { userId },
                _sum: { score: true }
            }),
            database_1.prisma.learningProgress.findFirst({
                where: { userId },
                orderBy: { completedAt: 'desc' },
                select: { completedAt: true }
            })
        ]);
        // Calculate streak days (simplified)
        const streakDays = lastActivity
            ? Math.max(0, Math.floor((Date.now() - lastActivity.completedAt.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;
        res.json({
            lessonsCompleted,
            conversationsCount,
            streakDays,
            totalScore: totalScore._sum.score || 0
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});
// Get learning progress
router.get('/progress', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const progress = await database_1.prisma.learningProgress.findMany({
            where: { userId },
            orderBy: { completedAt: 'desc' },
            take: 10
        });
        res.json({ progress });
    }
    catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
//# sourceMappingURL=dashboard.js.map