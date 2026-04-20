import OpenAI from 'openai'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import { prisma } from '../lib/database'

const LANGUAGETOOL_ENDPOINT = process.env.LANGUAGETOOL_ENDPOINT || 'https://api.languagetool.org/v2/check'

interface PronunciationAnalysisResult {
  score: number;
  feedback: {
    errors: string[];
    suggestions: string[];
  };
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
      apiKey: process.env.GROQ_API_KEY || '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',
      baseURL: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1'
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
          model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
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
      console.error('AI API error (generateConversation):', error)

      return {
        content:
          "I'm having trouble connecting to the free AI tutor right now. Please try again in a moment.",
        suggestions: [
          'You can continue practicing by reading your last message aloud.',
        ],
        grammarCorrections: []
      }
    }
  }

  async checkGrammar(text: string, language: string): Promise<GrammarCorrection[]> {
    try {
      const langCode = this.convertLanguageToISO(language);
      const response = await axios.post(
        LANGUAGETOOL_ENDPOINT,
        new URLSearchParams({ text, language: langCode }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
        
      const corrections: GrammarCorrection[] = [];
        
      for (const match of response.data.matches) {
        if (match.replacements && match.replacements.length > 0) {
          const original = text.substring(match.offset, match.offset + match.length);
          const corrected = match.replacements[0].value;
          const explanation = match.message;
            
          corrections.push({
            original,
            corrected,
            explanation,
            confidence: 0.9
          });
        }
      }
        
      return corrections;
    } catch (error) {
      console.error('Grammar check error:', error);
      try {
        const response = await this.client.chat.completions.create({
          model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
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

  async analyzePronunciation(
    transcription: string,
    expectedText: string,
    languageCode: string
  ): Promise<PronunciationAnalysisResult> {
    try {
      if (!transcription) {
        return {
          score: 0,
          feedback: {
            errors: ["No speech detected"],
            suggestions: ["Try speaking louder or closer to the microphone"]
          }
        }
      }

      // Calculate string similarity using native matching
      const similarity = this.calculateSimilarity(expectedText.toLowerCase(), transcription.toLowerCase().trim())
      const score = Math.max(10, Math.round(similarity * 100))
      
      const feedback = this.generatePronunciationFeedback(transcription.toLowerCase().trim(), expectedText.toLowerCase())
      
      return { score, feedback }
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
    const matrix = Array(str2.length + 1).fill(0).map(() => Array(str1.length + 1).fill(0))
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    return matrix[str2.length][str1.length]
  }

  private generatePronunciationFeedback(
    actualTranscription: string, 
    expectedText: string
  ): { errors: string[]; suggestions: string[] } {
    const errors: string[] = []
    const suggestions: string[] = []
    
    const actualWords = actualTranscription.split(' ')
    const expectedWords = expectedText.split(' ')
    const mispronouncedWords: string[] = []
    
    for (let i = 0; i < Math.min(actualWords.length, expectedWords.length); i++) {
      if (this.calculateSimilarity(actualWords[i], expectedWords[i]) < 0.8) {
        mispronouncedWords.push(expectedWords[i])
      }
    }
    
    if (mispronouncedWords.length > 0) {
      errors.push(`Words to practice: ${mispronouncedWords.slice(0, 3).join(', ')}`)
    }
    
    if (mispronouncedWords.length === 0) {
      suggestions.push("Excellent pronunciation! All words sounded correct.")
    } else {
      suggestions.push("Focus on the highlighted words for better clarity.")
      suggestions.push("Listen to the native example and mimic the rhythm.")
    }
    
    return { errors, suggestions }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    const { language, level, topic, personality } = context
    let prompt = `You are an AI language tutor helping someone learn ${language} at ${level} level.`
    if (personality) prompt += ` Your personality: ${personality}.`
    if (topic) prompt += ` Focus the conversation on: ${topic}.`
    prompt += `\nGuidelines:\n- Respond naturally\n- Make very brief, concise responses\n- Correct major mistakes politely.`
    return prompt
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
      promise.then(resolve).catch(reject).finally(() => clearTimeout(timeoutId))
    })
  }

  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('💡') || line.includes('Tip:')) suggestions.push(line.trim())
    }
    return suggestions
  }

  private extractGrammarCorrections(content: string): GrammarCorrection[] {
    const corrections: GrammarCorrection[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('❌') || line.includes('Correction:')) {
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
    return []
  }

  private parsePronunciationResponse(response: string): { score: number; feedback: any } {
    return { score: 85, feedback: { errors: [], suggestions: ["Good overall"] } }
  }
}
