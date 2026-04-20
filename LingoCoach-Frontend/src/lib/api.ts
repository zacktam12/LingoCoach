import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

// Attach token to every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token')
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (
      error.response?.status === 401 &&
      (error.response?.data as any)?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh-token') : null

      if (!refreshToken) {
        isRefreshing = false
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token')
          if (!window.location.pathname.startsWith('/auth/')) {
            window.location.href = '/auth/signin'
          }
        }
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
        localStorage.setItem('auth-token', data.token)
        localStorage.setItem('refresh-token', data.refreshToken)
        processQueue(null, data.token)
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('auth-token')
        localStorage.removeItem('refresh-token')
        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/signin'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('refresh-token')
        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/signin'
        }
      }
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  register: (userData: { email: string; password: string; name: string }) =>
    api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  refresh: (refreshToken: string) => api.post('/api/auth/refresh', { refreshToken }),
}

export const userAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data: { name?: string; image?: string }) =>
    api.put('/api/users/profile', data),
  getPreferences: () => api.get('/api/users/preferences'),
  updatePreferences: (data: {
    language?: string
    targetLanguage?: string
    learningLevel?: string
    dailyGoal?: number
    notifications?: Record<string, unknown>
    privacy?: Record<string, unknown>
  }) => api.put('/api/users/preferences', data),
}

export const conversationAPI = {
  sendMessage: (data: {
    message: string
    conversationId?: string
    language: string
    level: string
  }) => api.post('/api/conversations', data),
  getConversations: (params?: { page?: number; limit?: number }) =>
    api.get('/api/conversations', { params }),
  getConversation: (id: string) => api.get(`/api/conversations/${id}`),
  deleteConversation: (id: string) => api.delete(`/api/conversations/${id}`),
}

export const lessonAPI = {
  getLessons: (params?: {
    language?: string
    level?: string
    category?: string
    page?: number
    limit?: number
  }) => api.get('/api/lessons', { params }),
  getLesson: (id: string) => api.get(`/api/lessons/${id}`),
  completeLesson: (data: { lessonId: string; score: number; timeSpent: number }) =>
    api.post('/api/lessons/complete', data),
  createLesson: (data: {
    title: string
    description?: string
    content: any
    language: string
    level: string
    category: string
    duration?: number
  }) => api.post('/api/lessons', data),
  generateLesson: (data: {
    topic: string
    language: string
    level: string
    category: string
  }) => api.post('/api/lessons/generate', data),
}

export const pronunciationAPI = {
  analyze: (data: { expectedText: string; transcription: string; language?: string }) =>
    api.post('/api/pronunciation/analyze', data),
  getHistory: () => api.get('/api/pronunciation/history'),
  generatePhrase: (language: string) => api.get('/api/pronunciation/generate', { params: { language } }),
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
