"use client"

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import ProtectedRoute from '@/components/ProtectedRoute'
import { practiceAPI } from '@/lib/api'
import { usePracticeData } from '@/hooks/usePracticeData'
import { Spinner } from '@/components/ui/spinner'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

export default function PracticePage() {
  const [sentences, setSentences] = useState<any[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('')
  const [level, setLevel] = useState('')

  const queryClient = useQueryClient()
  const { data, isLoading, error } = usePracticeData()

  const shouldReduceMotion = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.04,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  }

  const motionListProps = shouldReduceMotion
    ? {}
    : { initial: 'hidden' as const, animate: 'visible' as const }

  useEffect(() => {
    if (data?.sentences) {
      setSentences(data.sentences)
    }
  }, [data])

  useEffect(() => {
    const prefs = data?.preferences
    if (!prefs) {
      if (!language) {
        setLanguage('es')
      }
      if (!level) {
        setLevel('beginner')
      }
      return
    }

    setLanguage((prev) => prev || prefs.targetLanguage || 'es')
    setLevel((prev) => prev || prefs.learningLevel || 'beginner')
  }, [data, language, level])

  const handleAdd = async () => {
    if (!text.trim() || !language) return

    try {
      setSaving(true)
      setActionError(null)

      const res = await practiceAPI.createSentence({
        text: text.trim(),
        language,
        level: level || undefined,
      })

      setSentences((prev) => [res.data.sentence, ...prev])
      queryClient.setQueryData(['practice', 'sentences-and-preferences'], (oldData: any) => ({
        ...(oldData || {}),
        sentences: [res.data.sentence, ...(oldData?.sentences || [])],
      }))
      setText('')
    } catch (err) {
      console.error('Create practice sentence error:', err)
      setActionError('Failed to save sentence')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await practiceAPI.deleteSentence(id)
      setSentences((prev) => prev.filter((s) => s.id !== id))
      queryClient.setQueryData(['practice', 'sentences-and-preferences'], (oldData: any) => ({
        ...(oldData || {}),
        sentences: (oldData?.sentences || []).filter((s: any) => s.id !== id),
      }))
    } catch (err) {
      console.error('Delete practice sentence error:', err)
      setActionError('Failed to delete sentence')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner className="h-12 w-12 text-blue-600" />
      </div>
    )
  }

  if (error || actionError) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
        {actionError || 'Failed to load practice sentences'}
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <BookOpen className="h-7 w-7 text-blue-600 dark:text-blue-400 mr-2" />
            My Practice Sentences
          </h1>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
            Save short sentences or phrases you want to practice. You can reuse them in conversations or
            pronunciation practice.
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Sentence</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sentence</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  placeholder="Write a sentence you want to practice..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="es">Spanish</option>
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={saving || !text.trim()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Save Sentence
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Saved Sentences</h2>
            {sentences.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You haven't saved any sentences yet. Add a few above to get started.
              </p>
            ) : (
              <motion.ul
                className="divide-y divide-gray-200 dark:divide-gray-700"
                variants={containerVariants}
                {...motionListProps}
              >
                {sentences.map((s) => {
                  const date = s.createdAt ? new Date(s.createdAt) : null
                  const dateLabel = date ? date.toLocaleDateString() : ''
                  return (
                    <motion.li
                      key={s.id}
                      className="py-3 flex items-start justify-between"
                      variants={itemVariants}
                    >
                      <div className="mr-4">
                        <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{s.text}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {s.language.toUpperCase()} {s.level ? `• ${s.level}` : ''}
                          {dateLabel ? ` • ${dateLabel}` : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-gray-400 hover:text-red-600"
                        aria-label="Delete sentence"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.li>
                  )
                })}
              </motion.ul>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
