'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, MicOff, Volume2, X } from 'lucide-react'
import { conversationAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

type AssistantState = 'idle' | 'listening' | 'thinking' | 'responding' | 'error'
const languageMap: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
}

export default function VoiceAssistant() {
  const recognitionRef = useRef<any>(null)
  const shouldKeepListeningRef = useRef(false)
  const startListeningRef = useRef<() => void>(() => undefined)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [assistantState, setAssistantState] = useState<AssistantState>('idle')
  const [transcript, setTranscript] = useState('')
  const [assistantReply, setAssistantReply] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isContinuousMode, setIsContinuousMode] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)

  const { isAuthenticated } = useAuthStore()
  const { targetLanguage, learningLevel } = usePreferencesStore()

  const stateLabel = useMemo(() => {
    if (assistantState === 'listening') return 'Listening...'
    if (assistantState === 'thinking') return 'Thinking...'
    if (assistantState === 'responding') return 'Speaking...'
    if (assistantState === 'error') return 'Something went wrong'
    return 'Tap to talk'
  }, [assistantState])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSpeechSupported(Boolean(SpeechRecognition))
  }, [])

  useEffect(() => {
    return () => {
      stopListening()
      stopAudioVisualizer()
      window.speechSynthesis?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isOpen && speechSupported) {
      shouldKeepListeningRef.current = true
      startListeningRef.current()
    } else {
      shouldKeepListeningRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, speechSupported, isContinuousMode])

  const openOverlay = () => {
    setIsOpen(true)
    setError(null)
    setAssistantReply('')
    setTranscript('')
    setAssistantState('idle')
  }

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    setAudioLevel(0)
  }

  const startAudioVisualizer = async () => {
    try {
      stopAudioVisualizer()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyserRef.current = analyser
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length
        setAudioLevel(Math.min(1, average / 120))
        animationFrameRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch (err) {
      console.error('Visualizer failed:', err)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    stopAudioVisualizer()
  }

  const closeOverlay = () => {
    shouldKeepListeningRef.current = false
    stopListening()
    window.speechSynthesis?.cancel()
    setIsOpen(false)
    setAssistantState('idle')
  }

  const speakReply = (reply: string) => {
    if (!reply.trim() || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(reply)
    utterance.lang = targetLanguage || 'en-US'
    utterance.rate = 1
    utterance.onstart = () => setAssistantState('responding')
    utterance.onend = () => {
      setAssistantState('idle')
      if (isContinuousMode && shouldKeepListeningRef.current) {
        setTimeout(() => startListeningRef.current(), 200)
      }
    }
    utterance.onerror = () => setAssistantState('idle')
    window.speechSynthesis.speak(utterance)
  }

  const getFallbackReply = (prompt: string) => {
    const lower = prompt.toLowerCase()
    if (lower.includes('lesson') || lower.includes('study')) {
      return 'Great choice. Let us start with a short speaking warm-up, then move into one focused lesson.'
    }
    if (lower.includes('practice') || lower.includes('pronunciation')) {
      return 'Perfect. Open pronunciation coach and read one phrase slowly, then repeat it faster for fluency.'
    }
    if (lower.includes('hello') || lower.includes('hi')) {
      return 'Hello. I am here and ready to help with your language goals.'
    }
    return 'I heard you. I can help you practice speaking, generate new lessons, or review your progress.'
  }

  const processPrompt = async (prompt: string) => {
    if (!prompt.trim()) return

    setTranscript(prompt)
    setError(null)
    setAssistantState('thinking')

    try {
      let reply = getFallbackReply(prompt)

      if (isAuthenticated) {
        const response = await conversationAPI.sendMessage({
          message: prompt,
          language: targetLanguage || 'en',
          level: learningLevel || 'beginner',
        })
        reply = response.data?.message?.content || response.data?.reply || reply
      }

      setAssistantReply(reply)
      speakReply(reply)
    } catch (err) {
      console.error('Voice assistant request failed:', err)
      const fallback = getFallbackReply(prompt)
      setAssistantReply(fallback)
      setError('Live AI is unavailable, using offline assistant response.')
      speakReply(fallback)
    }
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.')
      setAssistantState('error')
      return
    }

    try {
      stopListening()
      const recognition = new SpeechRecognition()
      recognition.lang = languageMap[targetLanguage || ''] || targetLanguage || 'en-US'
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onstart = () => {
        setAssistantState('listening')
        setError(null)
        startAudioVisualizer()
      }

      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const value = event.results[i][0].transcript
          if (event.results[i].isFinal) finalTranscript += value
          else interimTranscript += value
        }

        setTranscript(finalTranscript || interimTranscript)

        if (finalTranscript.trim()) {
          processPrompt(finalTranscript.trim())
        }
      }

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted') {
          setError(`Microphone error: ${event.error}`)
          setAssistantState('error')
        }
      }

      recognition.onend = () => {
        stopAudioVisualizer()
        if (assistantState === 'listening') setAssistantState('idle')
        if (
          isContinuousMode &&
          shouldKeepListeningRef.current &&
          assistantState !== 'thinking' &&
          assistantState !== 'responding'
        ) {
          setTimeout(() => startListeningRef.current(), 180)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Failed to start recognition:', err)
      setError('Could not access microphone. Please allow microphone permission.')
      setAssistantState('error')
    }
  }
  startListeningRef.current = startListening

  return (
    <>
      <button
        onClick={openOverlay}
        className="fixed bottom-6 right-6 z-[60] group flex items-center gap-3 rounded-full px-5 py-3 bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
      >
        <Mic size={18} />
        <span className="text-sm font-bold tracking-wide hidden sm:inline">Talk to DiburAI</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xl"
          >
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <button
                onClick={closeOverlay}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Close voice assistant"
              >
                <X size={20} />
              </button>
            </div>

            <div className="h-full w-full flex flex-col items-center justify-center px-6 text-center text-white">
              <div className="relative mb-8">
                <div className="assistant-wave assistant-wave-1" />
                <div className="assistant-wave assistant-wave-2" />
                <div className="assistant-wave assistant-wave-3" />
                <div
                  style={{
                    transform: `scale(${1 + audioLevel * 0.35})`,
                  }}
                  className={cn(
                    'relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 animate-bounce-slow',
                    assistantState === 'listening'
                      ? 'bg-primary shadow-[0_0_90px_rgba(59,130,246,0.85)]'
                      : 'bg-white/20 shadow-[0_0_40px_rgba(255,255,255,0.15)]'
                  )}
                >
                  {assistantState === 'error' ? <MicOff size={38} /> : <Mic size={38} />}
                </div>
              </div>

              <p className="mb-8 text-sm uppercase tracking-[0.25em] text-white/60 font-semibold">{stateLabel}</p>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setIsContinuousMode((prev) => !prev)}
                  className={cn(
                    'px-5 py-2.5 rounded-full border text-white text-xs font-bold uppercase tracking-wider transition-all',
                    isContinuousMode
                      ? 'bg-white/20 border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  )}
                >
                  {isContinuousMode ? 'Auto Listen On' : 'Auto Listen Off'}
                </button>
                <button
                  onClick={startListening}
                  disabled={!speechSupported || assistantState === 'thinking'}
                  className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_30px_rgba(59,130,246,0.55)]"
                >
                  {assistantState === 'listening' ? 'Listening' : 'Talk'}
                </button>
                <button
                  onClick={() => speakReply(assistantReply)}
                  disabled={!assistantReply}
                  className="px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Volume2 size={14} /> Replay
                  </span>
                </button>
              </div>

              {error ? <p className="mt-5 text-xs text-red-300/90 font-semibold">{error}</p> : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
