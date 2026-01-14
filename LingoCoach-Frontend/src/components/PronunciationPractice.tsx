'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Play, Square, RotateCcw, Volume2, VolumeX, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { pronunciationAPI, userAPI } from '@/lib/api'

export default function PronunciationPractice() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('en')
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        
        // Create a preview URL for playback
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        // You can use this audio object for playback if needed
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.')
      console.error('Microphone access error:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const analyzePronunciation = async () => {
    if (!audioBlob || !text) {
      setError('Please record audio and enter text to analyze')
      return
    }

    try {
      setIsAnalyzing(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('text', text)
      formData.append('language', language)

      const response = await pronunciationAPI.analyze(formData)

      setScore(response.data.score)
      setFeedback(response.data.feedback)

      // Refresh history so recent analysis appears
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
    setAudioBlob(null)
    setText('')
    setScore(null)
    setFeedback(null)
    setError(null)
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  // State for audio playback
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }
  
  // Function to get score color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }
  
  // Function to get score icon based on score
  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="inline mr-2 text-green-600" size={20} />
    if (score >= 60) return <AlertTriangle className="inline mr-2 text-yellow-600" size={20} />
    return <XCircle className="inline mr-2 text-red-600" size={20} />
  }
  
  // Function to get score message based on score
  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent!'
    if (score >= 80) return 'Great job!'
    if (score >= 70) return 'Good work!'
    if (score >= 60) return 'Not bad!'
    return 'Keep practicing!'
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <Mic className="mr-3 text-blue-600" size={30} />
        Pronunciation Practice
      </h2>
      
      {isAiDegraded && (
        <div className="mb-4 p-3 text-xs rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center">
          <AlertTriangle className="mr-2" size={16} />
          Pronunciation AI is temporarily unavailable. You can still record and listen to yourself while it recovers.
        </div>
      )}
      
      <div className="space-y-6">
        {/* Language Selection */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <span className="mr-2">🌐</span>
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>
        
        {/* Text Input */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <span className="mr-2">📝</span>
            Text to Practice
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to practice pronouncing..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white resize-none"
          />
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex justify-between">
            <span>{text.length}/500 characters</span>
            <span>Press Enter for new line</span>
          </div>
        </div>
        
        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isAnalyzing}
                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all duration-200 shadow-md"
              >
                <Mic className="mr-2" size={20} />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md"
              >
                <Square className="mr-2" size={20} />
                Stop Recording
              </button>
            )}
            
            <button
              onClick={resetPractice}
              disabled={isAnalyzing}
              className="flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all duration-200 shadow-md dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              <RotateCcw className="mr-2" size={20} />
              Reset
            </button>
          </div>
          
          {isRecording && (
            <div className="flex items-center text-red-600 dark:text-red-400 animate-pulse">
              <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse mr-2"></div>
              <span className="font-medium">Recording... Speak clearly!</span>
            </div>
          )}
          
          {audioBlob && (
            <div className="flex flex-col items-center space-y-3 w-full max-w-md">
              <div className="flex items-center justify-between w-full bg-gray-100 dark:bg-gray-600 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {audioBlob.type || 'audio/webm'}
                </span>
                <button 
                  onClick={handlePlayAudio}
                  className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
              <audio ref={audioRef} src={URL.createObjectURL(audioBlob)} onEnded={() => setIsPlaying(false)} />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Click the volume icon to play your recording
              </div>
            </div>
          )}
        </div>
        
        {/* Analyze Button */}
        {audioBlob && text && (
          <button
            onClick={analyzePronunciation}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 transition-all duration-200 shadow-lg"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Analyzing Pronunciation...
              </>
            ) : (
              <>
                <Mic className="mr-2" size={20} />
                Analyze Pronunciation
              </>
            )}
          </button>
        )}
        
        {/* Results */}
        {score !== null && (
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">📊</span>
                Analysis Results
              </h3>
              <div className="flex items-center">
                {getScoreIcon(score)}
                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}/100
                </span>
              </div>
            </div>
            
            <div className="text-center mb-4">
              <div className={`text-lg font-semibold ${getScoreColor(score)}`}>
                {getScoreMessage(score)}
              </div>
              <div className="mt-2 text-gray-700 dark:text-gray-300">
                Your pronunciation accuracy is {score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs improvement'}
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
              <div 
                className={`h-4 rounded-full ${score >= 80 ? 'bg-green-600' : score >= 60 ? 'bg-yellow-500' : 'bg-red-600'}`}
                style={{ width: `${score}%` }}
              ></div>
            </div>
            
            {feedback && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                  <span className="mr-2">💡</span>
                  Feedback & Suggestions
                </h4>
                <ul className="space-y-2">
                  {feedback.suggestions && feedback.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-start p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="mr-2 mt-0.5 text-blue-600">
                        {index + 1}.
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* History */}
        {history.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="mr-2">📋</span>
              Recent Pronunciation Sessions
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((item) => {
                const date = item.createdAt ? new Date(item.createdAt) : null
                const dateLabel = date ? date.toLocaleString() : ''
                return (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{item.text}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{dateLabel}</div>
                    </div>
                    <div className="flex items-center">
                      <span className={`font-bold ${getScoreColor(item.score)}`}>
                        {Math.round(item.score)}/100
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg flex items-start border border-red-200 dark:border-red-800">
            <AlertTriangle className="mr-2 mt-0.5 flex-shrink-0" size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}