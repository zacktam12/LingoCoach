'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, RotateCcw, AlertTriangle, CheckCircle, XCircle, History, Volume2 } from 'lucide-react'
import { pronunciationAPI, userAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import SpeechSynthesis from './SpeechSynthesis'

// Add types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
// Dynamic suggestions are fetched from the backend API

export default function PronunciationPractice() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcriptResult, setTranscriptResult] = useState<string>('')
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('en')
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  const recognitionRef = useRef<any>(null)

  const isAiDegraded =
    score === 0 &&
    feedback &&
    Array.isArray(feedback.errors) &&
    feedback.errors.includes('Failed to analyze pronunciation')

  useEffect(() => {
    loadHistory()
    loadPreferences()
  }, [])

  const loadHistory = async () => {
    try {
      const response = await pronunciationAPI.getHistory()
      setHistory(response.data.analyses || [])
    } catch (err) {
      console.error('Failed to load pronunciation history:', err)
    }
  }

  const loadPreferences = async () => {
    try {
      const response = await userAPI.getPreferences()
      const prefs = response.data.preferences
      if (prefs && prefs.targetLanguage) {
        setLanguage(prefs.targetLanguage)
      }
    } catch (err) {
      console.error('Failed to load user preferences:', err)
    }
  }

  const generateSuggestion = async (targetLang: string) => {
    try {
      setIsGenerating(true)
      setError(null)
      const res = await pronunciationAPI.generatePhrase(targetLang)
      if (res.data && res.data.phrase) {
        setText(res.data.phrase)
      }
    } catch (err) {
      console.error('Failed to generate phrase:', err)
      setError('Failed to generate a phrase block. Please try typing one.')
    } finally {
      setIsGenerating(false)
    }
  }

  const startRecording = async () => {
    if (!text) {
      setError('Please enter a text to practice first.')
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'en' ? 'en-US' : language;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
        setTranscriptResult('');
        setScore(null);
        setFeedback(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setTranscriptResult(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          analyzePronunciation(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          setError(`Microphone error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Failed to start microphone. Please check permissions.');
      console.error(err);
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const analyzePronunciation = async (transcriptionStr: string) => {
    if (!transcriptionStr || !text) {
      setError('Could not hear anything clearly. Please try again.')
      return
    }

    try {
      setIsAnalyzing(true)
      setError(null)
      
      const response = await pronunciationAPI.analyze({
        expectedText: text,
        transcription: transcriptionStr,
        language
      });

      setScore(response.data.score)
      setFeedback(response.data.feedback)
      loadHistory()
    } catch (err) {
      setError('Failed to analyze pronunciation. Please try again.')
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetPractice = () => {
    setIsRecording(false)
    setTranscriptResult('')
    setText('')
    setScore(null)
    setFeedback(null)
    setError(null)
    
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Main Practice Card */}
        <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                Target Phrase
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 rounded-2xl border border-primary/10">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Listen</span>
                  <SpeechSynthesis text={text} language={language} />
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-xs px-3 py-2 bg-secondary text-foreground rounded-full font-bold hover:bg-secondary/80 transition-colors cursor-pointer appearance-none border-none outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
                <button
                  onClick={() => generateSuggestion(language)}
                  disabled={isGenerating}
                  className="text-xs px-4 py-2 bg-secondary text-primary rounded-full font-bold hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? 'Generating...' : 'Get Suggestion'}
                  <RotateCcw size={14} className={isGenerating ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a phrase or get a suggestion..."
              className="w-full bg-secondary border-none rounded-[1.5rem] px-6 py-5 text-lg font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[120px]"
              disabled={isRecording || isAnalyzing}
            />

            <div className="flex items-center justify-center pt-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing || !text}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl",
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/20' 
                    : 'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20'
                )}
              >
                {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
              </button>
            </div>
            
            <p className="text-center text-sm text-muted-foreground font-medium">
              {isRecording ? "Recording... Speak now" : "Tap to start recording"}
            </p>
          </div>
        </div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {(isAnalyzing || score !== null || transcriptResult || error) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm"
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="font-bold text-muted-foreground animate-pulse">AI is analyzing your voice...</p>
                </div>
              ) : error ? (
                <div className="flex items-center gap-4 text-red-600 dark:text-red-400 bg-red-500/10 p-6 rounded-2xl border border-red-500/20">
                  <AlertTriangle size={24} />
                  <p className="font-medium">{error}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border pb-8">
                    <div className="text-center md:text-left">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Accuracy Score</p>
                      <div className={cn("text-6xl font-black", getScoreColor(score || 0))}>
                        {score}%
                      </div>
                    </div>
                    <div className="flex-1 max-w-xs w-full">
                      <div className="h-4 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-1000", score && score >= 80 ? 'bg-green-500' : score && score >= 60 ? 'bg-yellow-500' : 'bg-red-500')} 
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">What I heard</h4>
                        <SpeechSynthesis text={transcriptResult} language={language} />
                      </div>
                      <div className="p-5 bg-secondary rounded-2xl text-lg font-medium leading-relaxed italic">
                        "{transcriptResult}"
                      </div>
                    </div>

                    {feedback && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Feedback</h4>
                        <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                          <p className="text-foreground leading-relaxed">
                            {feedback.message || "Great effort! Your pronunciation is quite clear."}
                          </p>
                          {feedback.phoneticAccuracy && (
                            <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between">
                              <span className="text-xs font-bold text-primary uppercase">Phonetic Accuracy</span>
                              <span className="font-black text-primary">{Math.round(feedback.phoneticAccuracy * 100)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Sidebar */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <History size={20} className="text-primary" />
          History
        </h3>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {history.length > 0 ? (
            history.map((item, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-[1.5rem] hover:border-primary/20 transition-all shadow-sm group">
                <div className="flex justify-between items-start mb-3">
                  <div className={cn("text-2xl font-black", getScoreColor(item.score))}>
                    {item.score}%
                  </div>
                  <div className="flex items-center gap-2">
                    <SpeechSynthesis text={item.expectedText} language={item.language} />
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-2">
                  "{item.expectedText}"
                </p>
                <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {item.language?.toUpperCase() || 'EN'}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-secondary/30 rounded-[1.5rem] border border-dashed border-border">
              <p className="text-sm text-muted-foreground">No practice history yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}