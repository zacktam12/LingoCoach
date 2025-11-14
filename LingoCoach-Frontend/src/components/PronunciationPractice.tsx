'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Play, Square, RotateCcw } from 'lucide-react'
import { pronunciationAPI } from '@/lib/api'

export default function PronunciationPractice() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('en')
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioUrl(audioUrl)
        
        // In a real app, you would upload the audio file to a server
        // and get a URL to pass to the API
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
    if (!audioUrl || !text) {
      setError('Please record audio and enter text to analyze')
      return
    }

    try {
      setIsAnalyzing(true)
      setError(null)
      
      // In a real implementation, you would upload the audio file to your server
      // and get a permanent URL. For now, we'll use a placeholder.
      const response = await pronunciationAPI.analyze({
        audioUrl: 'placeholder-audio-url', // This would be the actual uploaded file URL
        text,
        language
      })
      
      setScore(response.score)
      setFeedback(response.feedback)
    } catch (err) {
      setError('Failed to analyze pronunciation. Please try again.')
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetPractice = () => {
    setIsRecording(false)
    setAudioUrl(null)
    setText('')
    setScore(null)
    setFeedback(null)
    setError(null)
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pronunciation Practice</h2>
      
      <div className="space-y-6">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
          
          {audioUrl && (
            <div className="flex items-center space-x-2">
              <audio src={audioUrl} controls className="w-64" />
            </div>
          )}
        </div>
        
        {/* Analyze Button */}
        {audioUrl && text && (
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
                  {feedback.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="text-blue-700 dark:text-blue-300">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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