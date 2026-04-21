'use client'

import { useState, useEffect } from 'react'
import { useLessonsQuery } from '@/hooks/useLessons'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { BookOpen, Clock, Star, Play, Plus } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { motion, useReducedMotion } from 'framer-motion'
import { LessonCardSkeleton } from '@/components/ui/skeleton'

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
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="h-12 w-48 bg-muted rounded-2xl animate-pulse mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => <LessonCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-20 glass-card text-red-600 dark:text-red-400 rounded-3xl border border-red-500/20 text-center">
        <h3 className="text-xl font-bold mb-2">Oops!</h3>
        <p>Failed to load lessons. Please try again later.</p>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-4">
                Learning Library
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Choose from a variety of AI-generated lessons tailored to your level and goals.
              </p>
            </div>
            <Link href="/lessons/new">
              <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                <Plus size={20} />
                <span>Create Lesson</span>
              </button>
            </Link>
          </div>
          
          {/* Filters */}
          <div className="bg-card rounded-[2.5rem] border border-border p-8 mb-12 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  Language
                </label>
                <select
                  value={filter.language}
                  onChange={(e) => setFilter({...filter, language: e.target.value})}
                  className="w-full px-4 py-3 bg-secondary border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Languages</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  Level
                </label>
                <select
                  value={filter.level}
                  onChange={(e) => setFilter({...filter, level: e.target.value})}
                  className="w-full px-4 py-3 bg-secondary border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  Category
                </label>
                <select
                  value={filter.category}
                  onChange={(e) => setFilter({...filter, category: e.target.value})}
                  className="w-full px-4 py-3 bg-secondary border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            {...motionListProps}
          >
            {lessons.map((lesson) => (
              <motion.div
                key={lesson.id}
                className="bg-card rounded-[2.5rem] border border-border overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all group"
                variants={itemVariants}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                      <BookOpen size={24} />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-bold">
                      <Star size={14} className="fill-current" />
                      4.8
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-foreground mb-3 leading-tight group-hover:text-primary transition-colors">
                    {lesson.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-6 line-clamp-2 leading-relaxed">
                    {lesson.description || 'Learn key concepts in this lesson with AI assistance.'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {lesson.duration || 10} min
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      {lesson.level || 'Beginner'}
                    </div>
                  </div>
                  
                  <Link href={`/lessons/${lesson.id}`}>
                    <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-secondary text-primary rounded-2xl font-bold group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <Play size={18} />
                      Start Learning
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
            
            {lessons.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground mx-auto mb-6">
                  <BookOpen size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">No lessons found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Try adjusting your filters or create a new personalized lesson.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}