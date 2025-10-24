"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = require("./lib/database");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./routes/auth");
const conversations_1 = require("./routes/conversations");
const lessons_1 = require("./routes/lessons");
const dashboard_1 = require("./routes/dashboard");
const users_1 = require("./routes/users");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/conversations', conversations_1.conversationRoutes);
app.use('/api/lessons', lessons_1.lessonRoutes);
app.use('/api/dashboard', dashboard_1.dashboardRoutes);
app.use('/api/users', users_1.userRoutes);
// WebSocket for real-time conversations
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join-conversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });
    socket.on('send-message', async (data) => {
        try {
            // Process message with AI
            const response = await processMessageWithAI(data.message, data.language, data.level);
            // Broadcast to conversation room
            socket.to(data.conversationId).emit('ai-response', {
                message: response.content,
                suggestions: response.suggestions,
                grammarCorrections: response.grammarCorrections
            });
        }
        catch (error) {
            socket.emit('error', { message: 'Failed to process message' });
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
// Error handling
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Start server
server.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await database_1.prisma.$disconnect();
    server.close(() => {
        console.log('Process terminated');
    });
});
// AI message processing function
async function processMessageWithAI(message, language, level) {
    // This would integrate with your AI service
    // For now, return a mock response
    return {
        content: `AI Response to: "${message}"`,
        suggestions: ['Try using more descriptive words', 'Consider the context'],
        grammarCorrections: []
    };
}
//# sourceMappingURL=server.js.map