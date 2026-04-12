# LingoCoach — AI Language Learning Platform

An AI-powered language learning platform with real-time conversation practice, pronunciation analysis, adaptive lessons, and progress tracking.

## Tech Stack

**Backend:** Node.js + Express + TypeScript, PostgreSQL + Prisma, Redis, Socket.io, DeepSeek AI, Google Cloud Speech/TTS

**Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand, TanStack Query

---

## Quick Start (Docker)

```bash
# 1. Copy and fill in environment variables
cp .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Run database migrations and seed
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run db:seed
```

App will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health/full

---

## Local Development

### Backend

```bash
cd LingoCoach-Backend
cp env.example .env        # fill in your values
npm install
npx prisma migrate dev     # run migrations
npm run db:seed            # seed lessons & achievements
npm run dev                # starts on port 3001
```

### Frontend

```bash
cd LingoCoach-Frontend
cp env.example .env.local  # fill in your values
npm install
npm run dev                # starts on port 3000
```

---

## Environment Variables

### Backend (`LingoCoach-Backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 32 chars) |
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI conversations |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Google Cloud service account JSON |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend (`LingoCoach-Frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/dashboard/stats` | User stats |
| GET | `/api/lessons` | List lessons (paginated) |
| GET | `/api/lessons/:id` | Get lesson detail |
| POST | `/api/lessons/complete` | Mark lesson complete |
| GET | `/api/conversations` | List conversations (paginated) |
| POST | `/api/conversations` | Send message / start conversation |
| POST | `/api/pronunciation/analyze` | Analyze pronunciation audio |
| GET | `/api/dashboard/analytics` | Learning analytics |
| GET | `/api/dashboard/achievements` | User achievements |

---

## Features

- AI conversation practice with DeepSeek
- Real-time messaging via WebSocket
- Interactive lessons with vocabulary, grammar, and quizzes
- Pronunciation analysis with Google Cloud Speech
- Text-to-speech for AI responses
- Progress tracking and streak system
- Achievement system
- Adaptive recommendations
- PWA support
