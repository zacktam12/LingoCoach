# LingoCoach - AI Language Learning Platform

This repository contains the **separate frontend and backend repositories** for the LingoCoach AI-powered language learning platform.

## 📁 Repository Structure

```
LingoCoach/
├── LingoCoach-Frontend/     # Next.js Frontend Application
├── LingoCoach-Backend/      # Node.js/Express Backend API
├── AI_Language_Learning_Platform_Plan.md
├── SETUP-GUIDE.md
└── README.md
```

## 🚀 Quick Start

### 1. Frontend Setup
```bash
cd LingoCoach-Frontend
npm install
cp env.example .env.local
# Edit .env.local with your configuration
npm run dev
```
**Runs on:** http://localhost:3000

### 2. Backend Setup
```bash
cd LingoCoach-Backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run db:push
npm run dev
```
**Runs on:** http://localhost:3001

## 📚 Documentation

- **[Setup Guide](SETUP-GUIDE.md)** - Complete setup instructions
- **[Project Plan](AI_Language_Learning_Platform_Plan.md)** - Detailed project roadmap
- **[Frontend README](LingoCoach-Frontend/README.md)** - Frontend-specific documentation
- **[Backend README](LingoCoach-Backend/README.md)** - Backend-specific documentation

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Context
- **API Client**: Axios
- **Real-time**: Socket.io client
- **Authentication**: NextAuth.js

### Backend (Node.js/Express)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: DeepSeek API
- **Real-time**: Socket.io server
- **Authentication**: JWT tokens
- **File Storage**: AWS S3

## 🔗 Communication

- **REST API**: Frontend ↔ Backend HTTP communication
- **WebSocket**: Real-time conversation features
- **Authentication**: JWT token-based auth

## 🚀 Development

1. **Start Backend First:**
   ```bash
   cd LingoCoach-Backend
   npm run dev
   ```

2. **Then Start Frontend:**
   ```bash
   cd LingoCoach-Frontend
   npm run dev
   ```

3. **Access Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

## 📋 Features

### Core Features
- **AI Conversations** - Real-time chat with AI tutor
- **Pronunciation Analysis** - Speech recognition and feedback
- **Adaptive Learning** - Personalized lesson paths
- **Progress Tracking** - Analytics and achievements
- **Multi-language Support** - Multiple target languages

### Technical Features
- **Real-time Communication** - WebSocket integration
- **Responsive Design** - Mobile-first UI
- **Type Safety** - Full TypeScript support
- **Modern Architecture** - Clean separation of concerns

## 🤝 Contributing

Each repository has its own contribution guidelines:
- **Frontend**: See `LingoCoach-Frontend/README.md`
- **Backend**: See `LingoCoach-Backend/README.md`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For setup issues, see the [Setup Guide](SETUP-GUIDE.md).
For technical questions, check the individual repository READMEs.
