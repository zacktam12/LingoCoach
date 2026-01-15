'use client';

import { useState, useRef } from 'react';
import { Volume2, VolumeX, Play, Square } from 'lucide-react';
import { conversationAPI } from '@/lib/api';

interface SpeechSynthesisProps {
  text: string;
  language?: string;
}

export default function SpeechSynthesis({ text, language = 'en-US' }: SpeechSynthesisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpeak = async () => {
    if (!text.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Get audio from backend API
      const response = await conversationAPI.speak({ text, language });
      
      // Create a blob from the audio data
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // If we have an existing audio element, clean it up
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        if (audioRef.current) {
          URL.revokeObjectURL(audioRef.current.src);
          audioRef.current = null;
        }
      };
      
      audio.onerror = () => {
        setError('Failed to play audio');
        setIsPlaying(false);
      };
      
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setError('Failed to generate speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
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