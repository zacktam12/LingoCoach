import OpenAI from 'openai'
import speech from '@google-cloud/speech'
import textToSpeech from '@google-cloud/text-to-speech'
import LanguageToolApi from 'languagetool-api'
import path from 'path'
import fs from 'fs'
import { prisma } from '../lib/database'

const client = new speech.SpeechClient()
const ttsClient = new textToSpeech.TextToSpeechClient()
const languageTool = new LanguageToolApi({
  endpoint: process.env.LANGUAGETOOL_ENDPOINT || 'https://api.languagetool.org',
})

interface PronunciationAnalysisResult {
  score: number;
  feedback: {
    errors: string[];
    suggestions: string[];
  };
}

interface WordLevelDetails {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
  pronunciationAccuracy: number;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ConversationContext {
  language: string
  level: string
  topic?: string
  personality?: string
}

export interface DeepSeekResponse {
  content: string
  suggestions?: string[]
  grammarCorrections?: GrammarCorrection[]
}

export interface GrammarCorrection {
  original: string
  corrected: string
  explanation: string
  confidence: number
}

export class DeepSeekService {
  private client: OpenAI
  private timeoutMs: number

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com/v1'
    })
    const parsedTimeout = parseInt(process.env.DEEPSEEK_TIMEOUT_MS || '15000', 10)
    this.timeoutMs = Number.isNaN(parsedTimeout) ? 15000 : parsedTimeout
  }

  async generateConversation(
    messages: ConversationMessage[],
    context: ConversationContext
  ): Promise<DeepSeekResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context)
      
      const response = await this.withTimeout(
        this.client.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
        this.timeoutMs
      )

      const content = response.choices[0]?.message?.content || ''
      
      return {
        content,
        suggestions: this.extractSuggestions(content),
        grammarCorrections: this.extractGrammarCorrections(content)
      }
    } catch (error) {
      console.error('DeepSeek API error (generateConversation):', error)

      // Return a safe fallback response so the rest of the app can continue
      return {
        content:
          "I'm having trouble connecting to the AI tutor right now. Please try again in a moment.",
        suggestions: [
          'You can continue practicing by reading your last message aloud.',
          'Try reviewing your recent lesson vocabulary while the AI reconnects.',
        ],
        grammarCorrections: []
      }
    }
  }

  async checkGrammar(text: string, language: string): Promise<GrammarCorrection[]> {
    try {
      // Use LanguageTool API for professional grammar checking
      const langCode = this.convertLanguageToISO(language);
      const response = await languageTool.check(text, langCode);
        
      const corrections: GrammarCorrection[] = [];
        
      // Process LanguageTool results into our format
      for (const match of response.matches) {
        if (match.replacements && match.replacements.length > 0) {
          const original = text.substring(match.offset, match.offset + match.length);
          const corrected = match.replacements[0].value;
          const explanation = match.message;
            
          corrections.push({
            original,
            corrected,
            explanation,
            confidence: 0.9 // LanguageTool typically provides high-confidence corrections
          });
        }
      }
        
      return corrections;
    } catch (error) {
      console.error('Grammar check error:', error);
      // Fallback to the original implementation if LanguageTool fails
      try {
        const response = await this.client.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a grammar checker for ${language}. Analyze the text and provide corrections with explanations.`
            },
            {
              role: 'user',
              content: `Please check the grammar of this text: "${text}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        });
  
        return this.parseGrammarResponse(response.choices[0]?.message?.content || '');
      } catch (fallbackError) {
        console.error('Fallback grammar check error:', fallbackError);
        return [];
      }
    }
  }
    
  convertLanguageToISO(language: string): string {
    // Convert language names to ISO codes for LanguageTool
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'english': 'en-US',
      'es': 'es',
      'spanish': 'es',
      'fr': 'fr',
      'french': 'fr',
      'de': 'de',
      'german': 'de',
      'it': 'it',
      'italian': 'it',
      'pt': 'pt-PT',
      'portuguese': 'pt-PT',
    };
      
    return languageMap[language.toLowerCase()] || 'en-US';
  }
  
  async synthesizeSpeech(text: string, languageCode: string, outputFile: string): Promise<void> {
    try {
      const request = {
        input: { text: text },
        voice: {
          languageCode: languageCode,
          ssmlGender: 'NEUTRAL' as const,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
        },
      };
      
      const [response] = await ttsClient.synthesizeSpeech(request);
      
      if (response.audioContent) {
        fs.writeFileSync(outputFile, response.audioContent as Buffer);
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw error;
    }
  }
  
  async synthesizeSpeechBuffer(text: string, languageCode: string): Promise<Buffer> {
    try {
      const request = {
        input: { text: text },
        voice: {
          languageCode: languageCode,
          ssmlGender: 'NEUTRAL' as const,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
        },
      };
      
      const [response] = await ttsClient.synthesizeSpeech(request);
      
      if (response.audioContent) {
        return response.audioContent as Buffer;
      } else {
        throw new Error('No audio content returned from TTS service');
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw error;
    }
  }

  async analyzePronunciation(
    audioFilePath: string,
    expectedText: string,
    languageCode: string
  ): Promise<PronunciationAnalysisResult> {
    try {
      // Read the audio file
      const audioContent = fs.readFileSync(audioFilePath)
      const audioBytes = audioContent.toString('base64')

      // Configure the request for pronunciation analysis
      const request = {
        audio: {
          content: audioBytes,
        },
        config: {
          encoding: 'WEBM_OPUS' as const, // Adjust based on your audio format
          sampleRateHertz: 48000, // Adjust based on your audio sample rate
          languageCode: languageCode,
        },
        // Enable pronunciation assessment for detailed feedback
        enableWordTimeOffsets: true,
        enableAutomaticPunctuation: true,
        enableSpeakerDiarization: false,
      }

      // Perform the speech recognition
      const [response] = await client.recognize(request as any)
      
      const transcription = response.results
        ?.map((result: any) => result.alternatives?.[0]?.transcript)
        .join(' ')
        .toLowerCase()
        .trim()

      // If no transcription was detected, return failure result
      if (!transcription) {
        return {
          score: 0,
          feedback: {
            errors: ["No speech detected in audio"],
            suggestions: ["Try speaking louder or closer to the microphone"]
          }
        }
      }

      // Calculate similarity between expected text and transcription
      const similarity = this.calculateSimilarity(expectedText.toLowerCase(), transcription)
      
      // Convert similarity to score (0-100)
      const score = Math.round(similarity * 100)
      
      // Extract word-level details if available
      const wordDetails: WordLevelDetails[] = []
      
      // Process each result to get word-level information
      if (response.results && response.results.length > 0) {
        for (const result of response.results) {
          if (result.alternatives && result.alternatives.length > 0) {
            const alternative = result.alternatives[0]
            
            if (alternative.words) {
              for (const wordInfo of alternative.words) {
                const word = wordInfo.word?.toLowerCase() || ''
                const startTime = Number(wordInfo.startTime?.seconds) || 0
                const endTime = Number(wordInfo.endTime?.seconds) || 0
                const confidence = Number(wordInfo.confidence) || 0
                
                // Calculate pronunciation accuracy for this word
                const expectedWords = expectedText.toLowerCase().split(' ')
                const pronunciationAccuracy = this.assessWordPronunciation(word, expectedWords)
                
                if (word) {
                  wordDetails.push({
                    word,
                    startTime,
                    endTime,
                    confidence,
                    pronunciationAccuracy
                  })
                }
              }
            }
          }
        }
      }
      
      // Generate feedback based on the analysis
      const feedback = this.generatePronunciationFeedback(transcription, expectedText, wordDetails)
      
      return {
        score,
        feedback
      }
    } catch (error) {
      console.error('Pronunciation analysis error:', error)
      return { 
        score: 0, 
        feedback: { 
          errors: ["Failed to analyze pronunciation"], 
          suggestions: ["Please try again later"] 
        } 
      }
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation using Levenshtein distance concept
    const cleanStr1 = str1.replace(/[\W_]/g, '')
    const cleanStr2 = str2.replace(/[\W_]/g, '')
    
    if (cleanStr1 === cleanStr2) return 1
    
    const longer = cleanStr1.length > cleanStr2.length ? cleanStr1 : cleanStr2
    const shorter = cleanStr1.length > cleanStr2.length ? cleanStr2 : cleanStr1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(cleanStr1, cleanStr2)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(0)
      .map(() => Array(str1.length + 1).fill(0))

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  private assessWordPronunciation(word: string, expectedWords: string[]): number {
    // Check if the word is similar to any of the expected words
    let maxSimilarity = 0
    
    for (const expectedWord of expectedWords) {
      const similarity = this.calculateSimilarity(word, expectedWord)
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity
      }
    }
    
    return maxSimilarity
  }

  private generatePronunciationFeedback(
    actualTranscription: string, 
    expectedText: string, 
    wordDetails: WordLevelDetails[]
  ): {
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = []
    const suggestions: string[] = []
    
    // Compare actual vs expected text
    const actualWords = actualTranscription.split(' ')
    const expectedWords = expectedText.toLowerCase().split(' ')
    
    // Identify mispronounced words
    const mispronouncedWords: string[] = []
    
    for (let i = 0; i < Math.min(actualWords.length, expectedWords.length); i++) {
      const actualWord = actualWords[i]
      const expectedWord = expectedWords[i]
      
      if (this.calculateSimilarity(actualWord, expectedWord) < 0.8) {
        mispronouncedWords.push(expectedWord)
      }
    }
    
    if (mispronouncedWords.length > 0) {
      errors.push(`Mispronounced words: ${mispronouncedWords.slice(0, 3).join(', ')}`)
    }
    
    // Generate suggestions based on analysis
    suggestions.push("Good pronunciation overall!")
    
    if (wordDetails.length > 0) {
      // Calculate average confidence
      const avgConfidence = wordDetails.reduce((sum, word) => sum + word.confidence, 0) / wordDetails.length
      
      if (avgConfidence < 0.7) {
        suggestions.push("Try speaking more clearly and distinctly")
      }
    }
    
    // Add more specific suggestions
    suggestions.push("Focus on vowel sounds for better clarity")
    suggestions.push("Pay attention to word stress patterns")
    
    return {
      errors,
      suggestions
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    const { language, level, topic, personality } = context
    
    let prompt = `You are an AI language tutor helping someone learn ${language} at ${level} level.`
    
    if (personality) {
      prompt += ` Your personality: ${personality}.`
    }
    
    if (topic) {
      prompt += ` Focus the conversation on: ${topic}.`
    }
    
    prompt += `
    
    Guidelines:
    - Respond naturally and conversationally
    - Use appropriate vocabulary for ${level} level
    - Provide gentle corrections when needed
    - Ask engaging questions to keep the conversation flowing
    - Be encouraging and supportive
    - Keep responses concise but informative
    `
    
    return prompt
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`DeepSeek request timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      promise
        .then((result) => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch((err) => {
          clearTimeout(timeoutId)
          reject(err)
        })
    })
  }

  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      if (line.includes('💡') || line.includes('Tip:') || line.includes('Suggestion:')) {
        suggestions.push(line.trim())
      }
    }
    
    return suggestions
  }

  private extractGrammarCorrections(content: string): GrammarCorrection[] {
    const corrections: GrammarCorrection[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      if (line.includes('❌') || line.includes('✅') || line.includes('Correction:')) {
        const match = line.match(/(.*?)\s*→\s*(.*?)(?:\s*\((.*?)\))?/)
        if (match) {
          corrections.push({
            original: match[1].trim(),
            corrected: match[2].trim(),
            explanation: match[3]?.trim() || '',
            confidence: 0.8
          })
        }
      }
    }
    
    return corrections
  }

  private parseGrammarResponse(response: string): GrammarCorrection[] {
    // Parse grammar check response into structured format
    const corrections: GrammarCorrection[] = []
    
    // This would need more sophisticated parsing based on actual API response format
    return corrections
  }

  private parsePronunciationResponse(response: string): { score: number; feedback: any } {
    // Parse pronunciation analysis response
    // This is a simplified implementation - in reality, this would be more sophisticated
    return {
      score: 85,
      feedback: {
        errors: [],
        suggestions: [
          "Good pronunciation overall!",
          "Try to emphasize the stress on longer words",
          "Practice the 'th' sound more"
        ]
      }
    }
  }
}
