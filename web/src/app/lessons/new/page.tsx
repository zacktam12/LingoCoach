'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { lessonAPI } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ChevronLeft, Sparkles, Plus, Loader2, Save } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NewLesson() {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // AI Form State
  const [aiForm, setAiForm] = useState({
    topic: '',
    language: 'en',
    level: 'beginner',
    category: 'vocabulary'
  })

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    title: '',
    description: '',
    language: 'en',
    level: 'beginner',
    category: 'vocabulary',
    content: ''
  })

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await lessonAPI.generateLesson(aiForm)
      router.push(`/lessons/${res.data.lesson.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate lesson. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let parsedContent = {}
      try {
        parsedContent = JSON.parse(manualForm.content)
      } catch {
        setError('Invalid JSON content. Please check your syntax.')
        setLoading(false)
        return
      }

      const res = await lessonAPI.createLesson({
        ...manualForm,
        content: parsedContent
      })
      router.push(`/lessons/${res.data.lesson.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create lesson. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Create New Lesson</h1>

          <div className="flex gap-4 p-1 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-8">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'ai' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Sparkles className="h-5 w-5" />
              AI Generator
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'manual' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Plus className="h-5 w-5" />
              Manual Builder
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-4 rounded-xl mb-8 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {activeTab === 'ai' ? (
            <motion.form 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAiGenerate} 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 space-y-6"
            >
              <div>
                <label className={labelClasses}>What do you want to learn about?</label>
                <input
                  type="text"
                  placeholder="e.g. Ordering coffee at a French cafe"
                  className={inputClasses}
                  value={aiForm.topic}
                  onChange={(e) => setAiForm({...aiForm, topic: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Language</label>
                  <select 
                    className={inputClasses}
                    value={aiForm.language}
                    onChange={(e) => setAiForm({...aiForm, language: e.target.value})}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Level</label>
                  <select 
                    className={inputClasses}
                    value={aiForm.level}
                    onChange={(e) => setAiForm({...aiForm, level: e.target.value})}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Category</label>
                <select 
                  className={inputClasses}
                  value={aiForm.category}
                  onChange={(e) => setAiForm({...aiForm, category: e.target.value})}
                >
                  <option value="vocabulary">Vocabulary</option>
                  <option value="grammar">Grammar</option>
                  <option value="conversation">Conversation</option>
                  <option value="pronunciation">Pronunciation</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {loading ? 'Generating Lesson...' : 'Generate New Lesson'}
              </button>
              <p className="text-center text-xs text-gray-500">AI will create a title, description, vocabulary list, and quiz based on your topic.</p>
            </motion.form>
          ) : (
            <motion.form 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleManualCreate} 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 space-y-6"
            >
              <div>
                <label className={labelClasses}>Lesson Title</label>
                <input
                  type="text"
                  placeholder="Enter lesson title"
                  className={inputClasses}
                  value={manualForm.title}
                  onChange={(e) => setManualForm({...manualForm, title: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className={labelClasses}>Description</label>
                <textarea
                  placeholder="What will users learn?"
                  rows={2}
                  className={inputClasses}
                  value={manualForm.description}
                  onChange={(e) => setManualForm({...manualForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Language</label>
                  <select 
                    className={inputClasses}
                    value={manualForm.language}
                    onChange={(e) => setManualForm({...manualForm, language: e.target.value})}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Level</label>
                  <select 
                    className={inputClasses}
                    value={manualForm.level}
                    onChange={(e) => setManualForm({...manualForm, level: e.target.value})}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Content JSON</label>
                <textarea
                  placeholder='{"vocabulary": [], "grammar": [], "quiz": []}'
                  rows={8}
                  className={`${inputClasses} font-mono text-sm`}
                  value={manualForm.content}
                  onChange={(e) => setManualForm({...manualForm, content: e.target.value})}
                  required
                />
                <p className="mt-2 text-xs text-gray-500">Provide lesson content in valid JSON format. Need help with the structure? Use the AI generator first!</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {loading ? 'Creating...' : 'Create Lesson Manually'}
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
