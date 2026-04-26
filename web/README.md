# LingoCoach Frontend

AI-Powered Language Learning Platform - Next.js Frontend

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone <frontend-repo-url>
cd LingoCoach-Frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

4. **Start development server:**
```bash
npm run dev
```

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **API Client**: Axios
- **Real-time**: Socket.io client
- **Authentication**: JWT token-based
- **Icons**: Lucide React

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── layout.tsx         # Root layout
│   ├── dashboard/         # Dashboard page
│   ├── lessons/           # Lessons pages
│   ├── conversations/     # Conversation pages
│   ├── pronunciation/     # Pronunciation practice
│   ├── profile/           # User profile
│   ├── achievements/      # Achievement tracking
│   └── auth/              # Authentication pages
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── Navigation.tsx    # Main navigation
│   ├── PWAInstaller.tsx  # PWA installation prompt
│   └── index.ts          # Component exports
├── lib/                  # Utility libraries
│   ├── api.ts           # API client
│   ├── utils.ts         # Helper functions
│   └── pwa.ts           # PWA utilities
└── types/               # TypeScript definitions
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# PWA Configuration
NEXT_PUBLIC_PWA_ENABLED=true
```

## 📋 Features

### Core Features
- **AI Conversations** - Real-time chat with AI tutor
- **Pronunciation Analysis** - Speech recognition and feedback
- **Adaptive Learning** - Personalized lesson paths
- **Progress Tracking** - Analytics and achievements
- **Multi-language Support** - Multiple target languages
- **User Profiles** - Personalized settings and preferences
- **Achievement System** - Gamification with badges

### Technical Features
- **Real-time Communication** - WebSocket integration
- **Responsive Design** - Mobile-first UI
- **Type Safety** - Full TypeScript support
- **Modern Architecture** - Clean separation of concerns
- **PWA Support** - Installable web application
- **Protected Routes** - Authentication guards
- **Component Reusability** - Modular design

## 🖼️ UI Components

### Navigation
- Responsive navbar with mobile menu
- Authentication-aware navigation
- Protected route handling

### Dashboard
- Learning statistics overview
- Quick access to all modules
- Progress tracking widgets

### Lessons
- Filterable lesson browser
- Detailed lesson views
- Lesson completion tracking

### Conversations
- Conversation history
- Real-time chat interface
- AI response visualization
- Grammar correction display

### Pronunciation
- Audio recording interface
- Pronunciation analysis
- Feedback visualization

### Profile Management
- User information editing
- Learning preferences
- Account settings

### Achievements
- Badge display system
- Progress tracking
- Category organization

## 🔄 API Integration

### Authentication
- User registration
- Login/logout functionality
- Token management
- Session persistence

### Data Management
- RESTful API consumption
- Error handling
- Loading states
- Data caching

## 📱 PWA Features

### Installation
- Install prompt handling
- Manifest configuration
- Service worker implementation
- Offline support

### Capabilities
- Add to home screen
- Push notifications (planned)
- Offline functionality
- App-like experience

## 🎨 Styling

### Design System
- Tailwind CSS utility classes
- Dark mode support
- Responsive breakpoints
- Consistent component design

### Themes
- Light/dark mode toggle
- Accessible color palette
- Consistent typography
- Mobile-first approach

## 🚀 Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm run start
```

### Docker Support
```bash
docker build -t lingocoach-frontend .
docker run -p 3000:3000 lingocoach-frontend
```

## 🧪 Testing

### Testing Strategy
- Component unit tests
- Integration tests
- End-to-end tests (planned)
- Accessibility testing (planned)

### Test Frameworks
- Jest for unit tests
- React Testing Library
- Cypress for E2E (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.