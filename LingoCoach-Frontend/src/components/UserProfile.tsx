'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { userAPI, authAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UserProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [preferences, setPreferences] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingPreferences, setIsEditingPreferences] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Form states
  const [name, setName] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [learningLevel, setLearningLevel] = useState('')
  const [dailyGoal, setDailyGoal] = useState(15)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const [profileRes, preferencesRes] = await Promise.all([
        userAPI.getProfile(),
        userAPI.getPreferences()
      ])
      
      setProfile(profileRes.data.user)
      setPreferences(preferencesRes.data.preferences)
      
      // Set form values
      setName(profileRes.data.user.name || '')
      setTargetLanguage(preferencesRes.data.preferences?.targetLanguage || 'es')
      setLearningLevel(preferencesRes.data.preferences?.learningLevel || 'beginner')
      setDailyGoal(preferencesRes.data.preferences?.dailyGoal || 15)
    } catch (err) {
      setError('Failed to load user data')
      console.error('Fetch user data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      const response = await userAPI.updateProfile({ name })
      setProfile(response.data.user)
      setIsEditing(false)
    } catch (err) {
      setError('Failed to update profile')
      console.error('Update profile error:', err)
    }
  }

  const updatePreferences = async () => {
    try {
      const response = await userAPI.updatePreferences({
        targetLanguage,
        learningLevel,
        dailyGoal
      })
      setPreferences(response.data.preferences)
      setIsEditingPreferences(false)
    } catch (err) {
      setError('Failed to update preferences')
      console.error('Update preferences error:', err)
    }
  }

  const handleLogout = async () => {
    try {
      // Best-effort logout request; JWT is stateless so this is mainly for symmetry
      await authAPI.logout().catch(() => undefined)
    } finally {
      localStorage.removeItem('auth-token')
      router.push('/auth/signin')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Profile</h1>
        <Button
          onClick={handleLogout}
          variant="destructive"
        >
          Log out
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Profile Information</CardTitle>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button
                    onClick={updateProfile}
                    variant="secondary"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setName(profile.name || '')
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profile.name || 'Not set'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{profile.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Member Since
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Learning Preferences</CardTitle>
              {!isEditingPreferences ? (
                <Button
                  onClick={() => setIsEditingPreferences(true)}
                >
                  Edit
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button
                    onClick={updatePreferences}
                    variant="secondary"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditingPreferences(false)
                      setTargetLanguage(preferences?.targetLanguage || 'es')
                      setLearningLevel(preferences?.learningLevel || 'beginner')
                      setDailyGoal(preferences?.dailyGoal || 15)
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Language
              </label>
              {isEditingPreferences ? (
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {getLanguageName(preferences?.targetLanguage || 'es')}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Learning Level
              </label>
              {isEditingPreferences ? (
                <select
                  value={learningLevel}
                  onChange={(e) => setLearningLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              ) : (
                <p className="text-gray-900 dark:text-white capitalize">
                  {preferences?.learningLevel || 'beginner'}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Daily Goal (minutes)
              </label>
              {isEditingPreferences ? (
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{preferences?.dailyGoal || 15} minutes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper function to get language name from code
function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ja': 'Japanese',
    'zh': 'Chinese'
  }
  return languages[code] || code
}