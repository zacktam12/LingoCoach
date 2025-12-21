import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth-token')
      window.location.href = '/auth/signin'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  register: (userData: { email: string; password: string; name: string }) =>
    api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
}

export const userAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data: { name?: string; image?: string }) =>
    api.put('/api/users/profile', data),
  getPreferences: () => api.get('/api/users/preferences'),
  updatePreferences: (data: {
    language?: string;
    targetLanguage?: string;
    learningLevel?: string;
    dailyGoal?: number;
    notifications?: any;
    privacy?: any;
  }) => api.put('/api/users/preferences', data),
}

export const conversationAPI = {
  sendMessage: (data: {
    message: string
    conversationId?: string
    language: string
    level: string
  }) => api.post('/api/conversations', data),
  getConversations: () => api.get('/api/conversations'),
  getConversation: (id: string) => api.get(`/api/conversations/${id}`),
}

export const lessonAPI = {
  getLessons: (params?: {
    language?: string
    level?: string
    category?: string
  }) => api.get('/api/lessons', { params }),
  getLesson: (id: string) => api.get(`/api/lessons/${id}`),
  completeLesson: (data: {
    lessonId: string
    score: number
    timeSpent: number
  }) => api.post('/api/lessons/complete', data),
}

export const pronunciationAPI = {
  analyze: (formData: FormData) =>
    api.post('/api/pronunciation/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getHistory: () => api.get('/api/pronunciation/history'),
}

export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
  getProgress: () => api.get('/api/dashboard/progress'),
  getAchievements: () => api.get('/api/dashboard/achievements'),
  getAllAchievements: () => api.get('/api/dashboard/achievements/all'),
  getAnalytics: () => api.get('/api/dashboard/analytics'),
  getRecommendations: () => api.get('/api/dashboard/recommendations'),
}

export const practiceAPI = {
  getSentences: () => api.get('/api/practice'),
  createSentence: (data: { text: string; language: string; level?: string }) =>
    api.post('/api/practice', data),
  deleteSentence: (id: string) => api.delete(`/api/practice/${id}`),
}

export default api