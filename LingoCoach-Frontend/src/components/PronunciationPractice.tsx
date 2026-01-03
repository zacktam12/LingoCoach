'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, RotateCcw } from 'lucide-react'
import { pronunciationAPI, userAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Pronunciation Practice</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
      {isAiDegraded && (
        <Alert className="mb-4">
          <AlertDescription>
            Pronunciation AI is temporarily unavailable. You can still record and listen to yourself while it recovers.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        {/* Language Selection */}
        <div>
          <Label htmlFor="language">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="it">Italian</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Text to Practice
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to practice pronouncing..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isAnalyzing}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <Mic className="mr-2" size={20} />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Square className="mr-2" size={20} />
                Stop Recording
              </button>
            )}
            
            <button
              onClick={resetPractice}
              disabled={isAnalyzing}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              <RotateCcw className="mr-2" size={20} />
              Reset
            </button>
          </div>
          
          {isRecording && (
            <div className="flex items-center text-red-600 dark:text-red-400">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></div>
              <span>Recording...</span>
            </div>
          )}
          
          {audioBlob && (
            <div className="flex items-center space-x-2">
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-64" />
            </div>
          )}
        </div>
        
        {/* Analyze Button */}
        {audioBlob && text && (
          <button
            onClick={analyzePronunciation}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              'Analyze Pronunciation'
            )}
          </button>
        )}
        
        {/* Results */}
        {score !== null && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Results</h3>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-300 mb-4">
              Score: {score}/100
            </div>
            
            {feedback && (
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Feedback:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {feedback.suggestions && feedback.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="text-blue-700 dark:text-blue-300">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* History */}
        {history.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recent Pronunciation Sessions</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {history.map((item) => {
                const date = item.createdAt ? new Date(item.createdAt) : null
                const dateLabel = date ? date.toLocaleString() : ''
                return (
                  <li key={item.id} className="flex justify-between">
                    <span className="mr-2 truncate">{item.text}</span>
                    <span className="ml-2 whitespace-nowrap">{Math.round(item.score)}/100{dateLabel ? ` • ${dateLabel}` : ''}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}