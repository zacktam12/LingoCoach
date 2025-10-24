# LingoCoach Backend

AI-Powered Language Learning Platform - Backend API

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation

1. **Clone the repository:**
```bash
git clone <backend-repo-url>
cd LingoCoach-Backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up database:**
```bash
npm run db:push
```

5. **Start development server:**
```bash
npm run dev
```

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Real-time**: Socket.io
- **AI Integration**: DeepSeek API
- **Authentication**: JWT tokens
- **File Storage**: AWS S3

### Project Structure
```
src/
├── server.ts              # Main server file
├── routes/                # API route handlers
│   ├── auth.ts           # Authentication routes
│   ├── conversations.ts  # AI conversation routes
│   ├── lessons.ts       # Lesson management
│   └── dashboard.ts      # User statistics
├── services/             # Business logic
│   ├── ai.ts            # AI service integration
│   ├── auth.ts          # Authentication service
│   └── storage.ts       # File storage service
├── middleware/           # Express middleware
│   ├── auth.ts          # JWT authentication
│   └── errorHandler.ts  # Error handling
├── lib/                  # Utilities
│   └── database.ts      # Database connection
└── types/               # TypeScript definitions
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Database Commands
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

### Environment Variables
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/lingocoach

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret-key

# AI Services
DEEPSEEK_API_KEY=your-deepseek-api-key
GOOGLE_CLOUD_API_KEY=your-google-api-key
AZURE_SPEECH_KEY=your-azure-speech-key

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket

# CORS
FRONTEND_URL=http://localhost:3000
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Conversations
- `POST /api/conversations` - Send message to AI
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/:id` - Get specific conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Lessons
- `GET /api/lessons` - Get available lessons
- `GET /api/lessons/:id` - Get specific lesson
- `POST /api/lessons/complete` - Complete a lesson

### Dashboard
- `GET /api/dashboard/stats` - Get user statistics
- `GET /api/dashboard/progress` - Get learning progress

## 🔌 WebSocket Events

### Client to Server
- `join-conversation` - Join a conversation room
- `send-message` - Send real-time message

### Server to Client
- `ai-response` - Receive AI response
- `error` - Error notifications

## 🤖 AI Integration

### DeepSeek API
- Conversation generation
- Grammar checking
- Learning suggestions
- Context-aware responses

### Speech Processing
- Speech-to-text recognition
- Text-to-speech synthesis
- Pronunciation analysis

## 🚀 Deployment

### Docker (Recommended)
```bash
docker build -t lingocoach-backend .
docker run -p 3001:3001 lingocoach-backend
```

### Manual Deployment
```bash
npm run build
npm run start
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Start the server

## 📊 Monitoring

### Health Check
- `GET /health` - Server health status

### Logging
- Morgan for HTTP request logging
- Console logging for errors
- Structured logging for production

## 🔒 Security

### Authentication
- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes middleware

### CORS
- Configured for frontend domain
- Credentials support enabled

### Helmet
- Security headers
- XSS protection
- Content Security Policy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
