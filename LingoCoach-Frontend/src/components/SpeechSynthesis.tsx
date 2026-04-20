'use client';

import { useState } from 'react';
import { Volume2, Square } from 'lucide-react';

interface SpeechSynthesisProps {
  text: string;
  language?: string;
}

export default function SpeechSynthesis({ text, language = 'en-US' }: SpeechSynthesisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSpeak = async () => {
    if (!text.trim()) return;
    
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Map language codes to supported voices if needed
      utterance.lang = language;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          setError('Failed to play audio. Your browser may be blocking it.');
        }
        setIsPlaying(false);
        setIsLoading(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setError('Failed to generate speech. Please try again.');
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={isPlaying ? handleStop : handleSpeak}
        disabled={isLoading || !text.trim()}
        className={`p-2 rounded-full ${
          isLoading 
            ? 'bg-gray-200 dark:bg-gray-700' 
            : isPlaying 
              ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300' 
              : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
        } hover:opacity-80 transition-opacity disabled:opacity-50`}
        title={isPlaying ? 'Stop' : 'Listen'}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : isPlaying ? (
          <Square size={16} />
        ) : (
          <Volume2 size={16} />
        )}
      </button>
      
      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm ml-2">
          {error}
        </div>
      )}
    </div>
  );
}