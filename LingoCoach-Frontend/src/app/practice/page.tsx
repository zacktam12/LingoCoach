"use client"

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import ProtectedRoute from '@/components/ProtectedRoute'
import { practiceAPI } from '@/lib/api'
import { usePracticeData } from '@/hooks/usePracticeData'
import { Spinner } from '@/components/ui/spinner'
import { BookOpen, Plus, Trash2, Volume2, Sparkles, Languages, Star, Mic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const languageConfig: Record<string, { label: string, color: string, bg: string, border: string }> = {
  es: { label: 'Spanish', color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20 hover:border-orange-500/50' },
  en: { label: 'English', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20 hover:border-blue-500/50' },
  fr: { label: 'French', color: 'text-indigo-600', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20 hover:border-indigo-500/50' },
  de: { label: 'German', color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20 hover:border-yellow-500/50' },
  it: { label: 'Italian', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/20 hover:border-green-500/50' },
  pt: { label: 'Portuguese', color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20 hover:border-emerald-500/50' },
}

const levelConfig: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-700 font-bold border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-700 font-bold border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-700 font-bold border-red-500/20'
}

function calculateScore(target: string, transcript: string) {
  const clean = (s: string) => s.toLowerCase().replace(/[.,!?;:¿¡"']/g, '').trim()
  const targetWords = clean(target).split(/\s+/)
  const transcriptWords = clean(transcript).split(/\s+/)
  
  let matches = 0
  const wordsMatch = targetWords.map(tw => {
    const matched = transcriptWords.includes(tw)
    if (matched) matches++
    return { word: tw, matched }
  })
  
  return {
    score: Math.round((matches / targetWords.length) * 100) || 0,
    words: wordsMatch
  }
}

export default function PracticePage() {
  const [sentences, setSentences] = useState<any[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('')
  const [level, setLevel] = useState('')
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, { score: number, transcript: string, words: {word: string, matched: boolean}[]}>>({})

  const queryClient = useQueryClient()
  const { data, isLoading, error } = usePracticeData()

  useEffect(() => {
    if (data?.sentences) {
      setSentences(data.sentences)
    }
  }, [data])

  useEffect(() => {
    const prefs = data?.preferences
    if (!prefs) {
      if (!language) setLanguage('es')
      if (!level) setLevel('beginner')
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

  const handleSpeak = (text: string, langCode: string, id: string) => {
    if (!window.speechSynthesis) return;
    setPlayingId(id)

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === 'en' ? 'en-US' : langCode;
    utterance.rate = 0.9; // Slightly slower for language learners!
    
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    
    window.speechSynthesis.speak(utterance);
  }

  const handleRecord = (text: string, langCode: string, id: string) => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setActionError("Speech recognition is not supported in this browser.")
      return
    }

    if (recordingId === id) {
      // Stop recording if already recording this specific id
      setRecordingId(null)
      return
    }

    setRecordingId(id)
    const recognition = new SpeechRecognition()
    recognition.lang = langCode === 'en' ? 'en-US' : (langCode === 'es' ? 'es-ES' : langCode)
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      const result = calculateScore(text, transcript)
      setScores(prev => ({
        ...prev,
        [id]: { transcript, ...result }
      }))
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error)
      setRecordingId(null)
    }

    recognition.onend = () => {
      setRecordingId(null)
    }

    try {
      recognition.start()
    } catch (e) {
      console.error(e)
      setRecordingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Spinner className="h-12 w-12 text-primary animate-pulse" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        
        {/* Dynamic Gamified Header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                <Sparkles className="h-4 w-4" /> Personal Phrasebook
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">
                Master Your <span className="text-primary">Sentences</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-muted-foreground max-w-xl">
                Build a private collection of tricky phrases, native idioms, or grammar rules. Listen to them aloud, memorize them, and master your fluency.
              </motion.p>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="hidden md:flex p-6 bg-card border-2 border-border rounded-3xl shadow-2xl rotate-3">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-2xl">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-black">{sentences.length}</div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Saved Phrases</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {error || actionError ? (
          <div className="max-w-7xl mx-auto mt-6 px-4">
            <div className="p-4 bg-red-500/10 text-red-600 font-bold rounded-2xl border border-red-500/20">
              {actionError || 'Failed to load practice sentences'}
            </div>
          </div>
        ) : null}

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Add Form (Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              <div className="bg-card border border-border shadow-xl rounded-3xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Plus className="h-6 w-6 text-primary" />
                  Add Phrase
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Target Sentence</label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                      placeholder="E.g., No lo puedo creer..."
                      className="w-full px-4 py-4 bg-secondary/50 border-none rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-primary/20 text-foreground resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Languages className="h-4 w-4" /> Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-4 bg-secondary/50 border-none rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-primary/20 text-foreground font-bold cursor-pointer"
                      >
                        <option value="es">🇪🇸 Spanish</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="fr">🇫🇷 French</option>
                        <option value="de">🇩🇪 German</option>
                        <option value="it">🇮🇹 Italian</option>
                        <option value="pt">🇵🇹 Portuguese</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4" /> Difficulty
                      </label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full px-4 py-4 bg-secondary/50 border-none rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-primary/20 text-foreground font-bold cursor-pointer"
                      >
                        <option value="beginner">🌟 Beginner</option>
                        <option value="intermediate">⚡ Intermediate</option>
                        <option value="advanced">🔥 Advanced</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleAdd}
                    disabled={saving || !text.trim()}
                    className="w-full mt-4 flex items-center justify-center p-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 hover:scale-[1.02] shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {saving ? (
                      <Spinner className="h-5 w-5 border-white border-t-transparent" />
                    ) : (
                      <>Save Flashcard</>
                    )}
                  </button>
                </div>
              </div>

              {/* Call to Action Banner */}
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-purple-500/20">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Mic className="h-5 w-5" /> Ready to speak?</h3>
                <p className="text-sm text-white/80 mb-4">Turn your written flashcards into audible practice sessions using our AI.</p>
                <Link href="/pronunciation">
                  <button className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl hover:shadow-lg transition-all active:scale-95">
                    Start Speaking
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: Flashcards Grid */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-foreground">Your Sandbox ({sentences.length})</h2>
              </div>

              {sentences.length === 0 ? (
                <div className="bg-card border-2 border-dashed border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center h-64">
                  <div className="p-4 bg-secondary rounded-full mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white mb-2">It's quiet in here...</h3>
                  <p className="text-muted-foreground">Save your first vocabulary phrase to the left to start building your collection!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {sentences.map((s, i) => {
                      const lang = languageConfig[s.language] || languageConfig['en']
                      const lvlBadge = levelConfig[s.level || 'beginner']
                      
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
                          transition={{ delay: i * 0.05 }}
                          className={`group relative bg-card rounded-3xl p-6 border-2 transition-all hover:-translate-y-1 hover:shadow-xl ${lang.border}`}
                        >
                          {/* Tags */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex gap-2">
                              <span className={`px-3 py-1 rounded-lg text-xs tracking-wider uppercase border ${lang.bg} ${lang.color} font-black`}>
                                {lang.label}
                              </span>
                              <span className={`px-3 py-1 rounded-lg text-xs tracking-wider uppercase border ${lvlBadge}`}>
                                {s.level || 'beginner'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-500/10 hover:text-red-600 text-muted-foreground transition-all focus:opacity-100"
                              title="Delete Flashcard"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Sentence Content */}
                          <div className="mb-6">
                            <p className="text-xl md:text-2xl font-bold leading-tight text-foreground break-words min-h-[3rem]">
                              {s.text}
                            </p>
                          </div>

                          {/* Score / Results Area */}
                          {scores[s.id] && (
                            <div className="mb-4 p-4 rounded-2xl bg-secondary/50 border border-border/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Pronunciation</span>
                                <span className={`text-sm font-black ${scores[s.id].score >= 80 ? 'text-green-500' : scores[s.id].score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                  {scores[s.id].score}% Accuracy
                                </span>
                              </div>
                              <p className="text-sm italic text-foreground/80 mb-2">"{scores[s.id].transcript}"</p>
                              <div className="flex flex-wrap gap-1">
                                {scores[s.id].words.map((w, idx) => (
                                  <span key={idx} className={w.matched ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-500 dark:text-red-400 font-medium line-through decoration-red-500/50'}>
                                    {w.word}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Bar */}
                          <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Flashcard
                            </span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleRecord(s.text, s.language, s.id)}
                                className={`p-3 rounded-full shadow-md transition-transform hover:scale-110 active:scale-95 ${
                                  recordingId === s.id 
                                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' 
                                    : 'bg-secondary text-foreground hover:bg-primary/20 hover:text-primary border border-border'
                                }`}
                                title="Practice Speaking"
                              >
                                <Mic className={`h-5 w-5 ${recordingId === s.id ? 'animate-bounce' : ''}`} />
                              </button>
                              <button 
                                onClick={() => handleSpeak(s.text, s.language, s.id)}
                                className={`p-3 rounded-full shadow-md transition-transform hover:scale-110 active:scale-95 ${
                                  playingId === s.id 
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white animate-pulse shadow-blue-500/50' 
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                                title="Listen"
                              >
                                <Volume2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
