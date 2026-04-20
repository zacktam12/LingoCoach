'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, RotateCcw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { pronunciationAPI, userAPI } from '@/lib/api'

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
  
  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="inline mr-2 text-green-600" size={20} />
    if (score >= 60) return <AlertTriangle className="inline mr-2 text-yellow-600" size={20} />
    return <XCircle className="inline mr-2 text-red-600" size={20} />
  }
  
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
          Pronunciation AI is temporarily unavailable.
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
            onChange={(e) => {
              const newLang = e.target.value;
              setLanguage(newLang);
              if (!text) {
                generateSuggestion(newLang);
              }
            }}
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
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center">
            <span>{text.length}/500 characters</span>
            <button 
              onClick={() => generateSuggestion(language)}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 font-semibold flex items-center transition-colors shadow-sm disabled:opacity-50"
            >
              {isGenerating ? (
                 <span className="mr-1 animate-spin text-sm">⏳</span>
              ) : (
                 <span className="mr-1">✨</span>
              )}
              {isGenerating ? 'Generating...' : 'Suggest Phrase'}
            </button>
          </div>
        </div>
        
        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isAnalyzing || !text.trim()}
                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all duration-200 shadow-md"
              >
                <Mic className="mr-2" size={20} />
                Start Speaking
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md"
              >
                <Square className="mr-2" size={20} />
                Stop
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
              <span className="font-medium">Listening... Speak clearly!</span>
            </div>
          )}

          {transcriptResult && (
            <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
               <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold block mb-2">You said:</span>
               <p className="text-gray-800 dark:text-white italic">"{transcriptResult}"</p>
            </div>
          )}
        </div>
        
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
                  {feedback.errors && feedback.errors.map((errStr: string, index: number) => (
                    <li key={'err'+index} className="flex items-start p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/50">
                      <div className="mr-2 mt-0.5 text-red-600">
                        {index + 1}.
                      </div>
                      <span className="text-red-700 dark:text-red-300">{errStr}</span>
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