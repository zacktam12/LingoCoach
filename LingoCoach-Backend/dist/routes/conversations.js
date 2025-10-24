"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ai_1 = require("../services/ai");
const database_1 = require("../lib/database");
const router = (0, express_1.Router)();
exports.conversationRoutes = router;
const deepseek = new ai_1.DeepSeekService(process.env.DEEPSEEK_API_KEY);
// Send message to AI
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { message, conversationId, language, level } = req.body;
        const userId = req.user.id;
        // Generate AI response
        const aiResponse = await deepseek.generateConversation([{ role: 'user', content: message }], { language, level });
        // Save or update conversation
        const conversation = await database_1.prisma.conversation.upsert({
            where: { id: conversationId || 'new' },
            update: {
                messages: {
                    push: [
                        { role: 'user', content: message, timestamp: new Date() },
                        { role: 'assistant', content: aiResponse.content, timestamp: new Date() }
                    ]
                }
            },
            create: {
                userId,
                language,
                level,
                messages: [
                    { role: 'user', content: message, timestamp: new Date() },
                    { role: 'assistant', content: aiResponse.content, timestamp: new Date() }
                ]
            }
        });
        res.json({
            message: aiResponse.content,
            suggestions: aiResponse.suggestions,
            grammarCorrections: aiResponse.grammarCorrections,
            conversationId: conversation.id
        });
    }
    catch (error) {
        console.error('Conversation error:', error);
        res.status(500).json({ error: 'Failed to process conversation' });
    }
});
// Get user conversations
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const conversations = await database_1.prisma.conversation.findMany({
            where: { userId: req.user.id },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                language: true,
                level: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json({ conversations });
    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});
// Get specific conversation
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const conversation = await database_1.prisma.conversation.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        res.json({ conversation });
    }
    catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
});
// Delete conversation
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        await database_1.prisma.conversation.deleteMany({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});
//# sourceMappingURL=conversations.js.map