'use client';

import { useState } from 'react';
import { Volume2, Square } from 'lucide-react';

interface SpeechSynthesisProps {
  text: string;
  language?: string;
}

export const getFullLangCode = (lang: string) => {
  const map: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'ru': 'ru-RU'
  };
  return map[lang.toLowerCase()] || lang;
};

export default function SpeechSynthesis({ text, language = 'en' }: SpeechSynthesisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure text is a string
  const safeText = text || '';

  const handleSpeak = async () => {
    if (!safeText.trim()) return;
    
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(safeText);
      
      // Use the helper to get the full BCP 47 tag
      utterance.lang = getFullLangCode(language);
      
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
        disabled={isLoading || !safeText.trim()}
        className={cn(
          "p-2.5 rounded-2xl transition-all duration-200 flex items-center justify-center shadow-sm disabled:opacity-30",
          isPlaying 
            ? "bg-red-500 text-white shadow-red-500/20" 
            : "bg-secondary text-primary hover:bg-primary hover:text-white"
        )}
        title={isPlaying ? 'Stop' : 'Listen'}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary/20 border-t-primary"></div>
        ) : isPlaying ? (
          <Square size={18} fill="currentColor" />
        ) : (
          <Volume2 size={18} />
        )}
      </button>
      
      {error && (
        <div className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-2 animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}

import { cn } from '@/lib/utils';