"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../lib/database");
const router = (0, express_1.Router)();
exports.userRoutes = router;
// Get user profile
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Update user profile
router.put('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, image } = req.body;
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(image && { image })
            },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                updatedAt: true
            }
        });
        res.json({ user });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
//# sourceMappingURL=users.js.map