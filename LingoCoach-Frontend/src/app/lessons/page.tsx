'use client'

import { useState, useEffect } from 'react'
import { useLessonsQuery } from '@/hooks/useLessons'
import { useUserPreferences } from '@/hooks/useUserPreferences'

import { BookOpen, Clock, Star, Play } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { motion, useReducedMotion } from 'framer-motion'

export default function Lessons() {
  const [lessons, setLessons] = useState<any[]>([])
  const [filter, setFilter] = useState({ language: '', level: '', category: '' })

  const { data, isLoading, error } = useLessonsQuery(filter)
  const { data: prefs } = useUserPreferences()

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
    if (!prefs) return

    setFilter((prev) => {
      const next = { ...prev }
      if (!prev.language && prefs.targetLanguage) {
        next.language = prefs.targetLanguage
      }
      if (!prev.level && prefs.learningLevel) {
        next.level = prefs.learningLevel
      }
      return next
    })
  }, [prefs])

  useEffect(() => {
    if (data) {
      setLessons(data)
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Lessons</h1>
          
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={filter.language}
                  onChange={(e) => setFilter({...filter, language: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Languages</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Level
                </label>
                <select
                  value={filter.level}
                  onChange={(e) => setFilter({...filter, level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filter.category}
                  onChange={(e) => setFilter({...filter, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  <option value="grammar">Grammar</option>
                  <option value="vocabulary">Vocabulary</option>
                  <option value="conversation">Conversation</option>
                  <option value="pronunciation">Pronunciation</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Lessons Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            {...motionListProps}
          >
            {lessons.map((lesson) => (
              <motion.div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                variants={itemVariants}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-center text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium ml-1">4.8</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {lesson.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {lesson.description || 'Learn key concepts in this lesson.'}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{lesson.duration || 10} min</span>
                  </div>
                  
                  <Link href={`/lessons/${lesson.id}`}>
                    <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      <Play className="h-4 w-4 mr-2" />
                      Start Lesson
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
            
            {lessons.length === 0 && (
              <motion.div
                className="col-span-full text-center py-12"
                variants={itemVariants}
              >
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No lessons found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters to see more lessons.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}