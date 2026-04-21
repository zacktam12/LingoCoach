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
import { cn } from '@/lib/utils'
import { getFullLangCode } from '@/components/SpeechSynthesis'

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
    utterance.lang = getFullLangCode(langCode);
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
      <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
        
        {/* Dynamic Header */}
        <div className="relative overflow-hidden border-b border-border bg-card/30 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-96 h-96 gemini-gradient opacity-[0.03] blur-3xl -mr-48 -mt-48" />
          <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center md:text-left">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-6">
                <Sparkles size={14} /> Personal Phrasebook
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-black text-foreground tracking-tighter mb-6">
                Master Your <span className="text-primary">Sentences</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Build a private collection of tricky phrases, native idioms, or grammar rules. Listen, practice, and master your fluency with AI.
              </motion.p>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="p-8 bg-card border border-border rounded-[2.5rem] shadow-xl relative group">
              <div className="absolute inset-0 gemini-gradient opacity-0 group-hover:opacity-[0.02] transition-opacity rounded-[2.5rem]" />
              <div className="flex items-center gap-6">
                <div className="p-5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                  <BookOpen size={32} />
                </div>
                <div>
                  <div className="text-4xl font-black leading-none mb-1">{sentences.length}</div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Phrases Saved</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {error || actionError ? (
          <div className="max-w-6xl mx-auto mt-8 px-6">
            <div className="p-4 bg-red-500/10 text-red-600 font-bold rounded-2xl border border-red-500/20 text-center text-sm">
              {actionError || 'Failed to load practice sentences'}
            </div>
          </div>
        ) : null}

        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* LEFT COLUMN: Add Form */}
            <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-8">
              <div className="bg-card border border-border shadow-sm rounded-[2.5rem] p-8">
                <h2 className="text-xl font-bold text-foreground mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  Add New Phrase
                </h2>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Target Sentence</label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                      placeholder="E.g., No lo puedo creer..."
                      className="w-full px-5 py-4 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-foreground resize-none font-medium text-lg placeholder:text-muted-foreground/50 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Languages size={12} /> Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-5 py-4 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-foreground font-bold cursor-pointer appearance-none"
                      >
                        <option value="es">Spanish</option>
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Star size={12} /> Difficulty
                      </label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full px-5 py-4 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-foreground font-bold cursor-pointer appearance-none"
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
                    className="w-full mt-4 flex items-center justify-center p-5 bg-primary text-primary-foreground font-bold rounded-2xl hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {saving ? (
                      <Spinner className="h-5 w-5 border-white border-t-transparent" />
                    ) : (
                      <>Save to Phrasebook</>
                    )}
                  </button>
                </div>
              </div>

              {/* Tips Banner */}
              <div className="glass-card rounded-[2.5rem] p-8 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 gemini-gradient opacity-10 blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity" />
                <h3 className="text-lg font-bold mb-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Mic size={18} />
                  </div>
                  Speaking Practice
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Click the microphone on any card to practice your pronunciation. Our AI will give you real-time feedback.
                </p>
                <Link href="/pronunciation">
                  <button className="w-full py-4 bg-secondary text-primary font-bold rounded-2xl hover:bg-primary hover:text-white transition-all">
                    Try Pronunciation Coach
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: Flashcards Grid */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-foreground tracking-tight">Your Sandbox</h2>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-secondary px-3 py-1 rounded-full">
                  {sentences.length} total
                </div>
              </div>

              {sentences.length === 0 ? (
                <div className="bg-card border border-border rounded-[2.5rem] p-16 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm">
                  <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground mb-6">
                    <BookOpen size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Your phrasebook is empty</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Add your first vocabulary phrase to the left to start building your personal collection!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {sentences.map((s, i) => {
                      const lang = languageConfig[s.language] || languageConfig['en']
                      const lvlBadge = levelConfig[s.level || 'beginner']
                      
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                          transition={{ delay: i * 0.05 }}
                          className="group relative bg-card rounded-[2.5rem] p-8 border border-border hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 flex flex-col"
                        >
                          {/* Tags */}
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex gap-2">
                              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", lang.bg, lang.color, "border-transparent")}>
                                {lang.label}
                              </span>
                              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", lvlBadge, "border-transparent")}>
                                {s.level || 'beginner'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-500/10 hover:text-red-600 text-muted-foreground transition-all"
                              title="Delete Phrase"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Sentence Content */}
                          <div className="mb-8 flex-1">
                            <p className="text-2xl font-bold leading-tight text-foreground break-words">
                              {s.text}
                            </p>
                          </div>

                          {/* Score / Results Area */}
                          {scores[s.id] && (
                            <div className="mb-8 p-6 rounded-3xl bg-secondary/50 border border-border/50 animate-fade-in">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accuracy</span>
                                <span className={cn("text-sm font-black", scores[s.id].score >= 80 ? 'text-green-500' : scores[s.id].score >= 50 ? 'text-yellow-500' : 'text-red-500')}>
                                  {scores[s.id].score}%
                                </span>
                              </div>
                              <p className="text-sm font-medium italic text-foreground leading-relaxed mb-4">"{scores[s.id].transcript}"</p>
                              <div className="flex flex-wrap gap-1.5">
                                {scores[s.id].words.map((w, idx) => (
                                  <span key={idx} className={cn(
                                    "px-2 py-0.5 rounded-md text-xs font-bold",
                                    w.matched 
                                      ? 'bg-green-500/10 text-green-600' 
                                      : 'bg-red-500/10 text-red-500 line-through decoration-2'
                                  )}>
                                    {w.word}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Bar */}
                          <div className="flex items-center justify-between pt-6 border-t border-border">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Sparkles size={12} className="text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Phrase</span>
                            </div>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleRecord(s.text, s.language, s.id)}
                                className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                                  recordingId === s.id 
                                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/20' 
                                    : 'bg-secondary text-primary hover:bg-primary hover:text-white'
                                )}
                              >
                                <Mic size={20} />
                              </button>
                              <button 
                                onClick={() => handleSpeak(s.text, s.language, s.id)}
                                className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                                  playingId === s.id 
                                    ? 'gemini-gradient text-white animate-pulse shadow-indigo-500/20' 
                                    : 'bg-secondary text-primary hover:bg-primary hover:text-white'
                                )}
                              >
                                <Volume2 size={20} />
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
