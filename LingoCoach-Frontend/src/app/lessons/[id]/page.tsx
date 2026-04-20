'use client'

import { useState, useEffect, useRef } from 'react'
import { lessonAPI } from '@/lib/api'
import { useLessonDetailQuery } from '@/hooks/useLessons'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { CheckCircle, XCircle, ChevronRight, ChevronLeft, BookOpen, Clock, Trophy, Volume2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VocabItem { term: string; translation?: string; example?: string }
interface GrammarRule { title?: string; explanation?: string; examples?: string[] }
interface LessonContent {
  vocabulary?: VocabItem[]
  grammar?: GrammarRule[]
  practice?: string[]
  quiz?: Array<{ question: string; options: string[]; answer: string }>
}

type Phase = 'learn' | 'quiz' | 'complete'

export default function LessonDetail({ params }: { params: { id: string } }) {
  const [phase, setPhase] = useState<Phase>('learn')
  const [quizIndex, setQuizIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startTime = useRef(Date.now())
  const router = useRouter()

  const { data: lesson, isLoading } = useLessonDetailQuery(params.id)

  const content: LessonContent = lesson?.content && typeof lesson.content === 'object'
    ? lesson.content as LessonContent
    : {}

  const quiz = content.quiz || []
  const currentQ = quiz[quizIndex]

  const handleAnswer = (option: string) => {
    if (selected) return
    setSelected(option)
    const correct = option === currentQ.answer
    if (correct) setScore((s) => s + 1)
    setAnswers((a) => [...a, correct])
  }

  const nextQuestion = () => {
    if (quizIndex + 1 < quiz.length) {
      setQuizIndex((i) => i + 1)
      setSelected(null)
    } else {
      setPhase('complete')
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000 / 60)
      const finalScore = quiz.length > 0 ? Math.round((score / quiz.length) * 100) : 100
      await lessonAPI.completeLesson({ lessonId: params.id, score: finalScore, timeSpent })
    } catch {
      setError('Could not save progress, but lesson is complete.')
    } finally {
      setCompleting(false)
    }
  }

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = lesson?.language || 'en'
      window.speechSynthesis.speak(utt)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lesson not found</h2>
        <button onClick={() => router.push('/lessons')} className="mt-4 text-blue-600 hover:underline">
          Back to lessons
        </button>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.push('/lessons')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="capitalize">{lesson.language}</span>
                <span>•</span>
                <span className="capitalize">{lesson.level}</span>
                <span>•</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{lesson.duration || 10} min</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mb-8">
            {(['learn', 'quiz', 'complete'] as Phase[]).map((p, i) => (
              <div key={p} className={`h-1.5 flex-1 rounded-full transition-all ${
                phase === p ? 'bg-blue-600' :
                (['learn', 'quiz', 'complete'].indexOf(phase) > i) ? 'bg-blue-300' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* LEARN PHASE */}
            {phase === 'learn' && (
              <motion.div key="learn" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                {content.vocabulary && content.vocabulary.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" /> Vocabulary
                    </h2>
                    <div className="grid gap-3">
                      {content.vocabulary.map((item, i) => (
                        <div key={i} className="flex items-start justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">{item.term}</span>
                            {item.translation && (
                              <span className="text-gray-500 dark:text-gray-400 ml-2">— {item.translation}</span>
                            )}
                            {item.example && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">{item.example}</p>
                            )}
                          </div>
                          <button onClick={() => speak(item.term)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors" aria-label={`Pronounce ${item.term}`}>
                            <Volume2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {content.grammar && content.grammar.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold mb-4">Grammar</h2>
                    <div className="space-y-4">
                      {content.grammar.map((rule, i) => (
                        <div key={i}>
                          {rule.title && <h3 className="font-medium text-gray-900 dark:text-white mb-1">{rule.title}</h3>}
                          {rule.explanation && <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{rule.explanation}</p>}
                          {rule.examples && rule.examples.length > 0 && (
                            <ul className="space-y-1">
                              {rule.examples.map((ex, j) => (
                                <li key={j} className="text-sm text-gray-600 dark:text-gray-400 pl-3 border-l-2 border-blue-300">{ex}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {content.practice && content.practice.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold mb-4">Practice Exercises</h2>
                    <ol className="space-y-2">
                      {content.practice.map((task, i) => (
                        <li key={i} className="flex gap-3 text-gray-700 dark:text-gray-300">
                          <span className="font-bold text-blue-600 shrink-0">{i + 1}.</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {!content.vocabulary && !content.grammar && !content.practice && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <p className="text-gray-600 dark:text-gray-400">{lesson.description || 'Lesson content will be available soon.'}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => quiz.length > 0 ? setPhase('quiz') : (setPhase('complete'), handleComplete())}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all active:scale-[0.98]"
                  >
                    {quiz.length > 0 ? 'Take Quiz' : 'Complete Lesson'}
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* QUIZ PHASE */}
            {phase === 'quiz' && currentQ && (
              <motion.div key={`quiz-${quizIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm text-gray-500">Question {quizIndex + 1} of {quiz.length}</span>
                    <span className="text-sm font-semibold text-blue-600">{score} correct</span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{currentQ.question}</h3>

                  <div className="grid gap-3">
                    {currentQ.options.map((option) => {
                      let style = 'border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      if (selected) {
                        if (option === currentQ.answer) style = 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        else if (option === selected) style = 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        else style = 'border-gray-200 dark:border-gray-600 opacity-50'
                      }
                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswer(option)}
                          disabled={!!selected}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${style}`}
                        >
                          <span className="text-gray-900 dark:text-white">{option}</span>
                          {selected && option === currentQ.answer && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {selected && option === selected && option !== currentQ.answer && <XCircle className="h-5 w-5 text-red-600" />}
                        </button>
                      )
                    })}
                  </div>

                  {selected && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex justify-end">
                      <button onClick={nextQuestion} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all">
                        {quizIndex + 1 < quiz.length ? 'Next Question' : 'See Results'}
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* COMPLETE PHASE */}
            {phase === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-10">
                  <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="h-10 w-10 text-yellow-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lesson Complete!</h2>
                  {quiz.length > 0 && (
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      You scored <span className="font-bold text-blue-600">{score}/{quiz.length}</span> ({Math.round((score / quiz.length) * 100)}%)
                    </p>
                  )}
                  {error && <p className="text-sm text-amber-600 mb-4">{error}</p>}
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => router.push('/lessons')} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all">
                      Back to Lessons
                    </button>
                    <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all">
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedRoute>
  )
}
