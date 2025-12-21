import OpenAI from 'openai'

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
      })

      return this.parseGrammarResponse(response.choices[0]?.message?.content || '')
    } catch (error) {
      console.error('Grammar check error:', error)
      return []
    }
  }

  async analyzePronunciation(text: string, language: string): Promise<{ score: number; feedback: any }> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a pronunciation expert for ${language}. Analyze the pronunciation of the given text and provide feedback.`
          },
          {
            role: 'user',
            content: `Please analyze the pronunciation of this text: "${text}". Provide a score from 0-100 and detailed feedback. Format your response as JSON with "score" and "feedback" fields.`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      // Try to parse the response as JSON
      try {
        const jsonResponse = JSON.parse(response.choices[0]?.message?.content || '{}');
        return {
          score: jsonResponse.score || 85,
          feedback: jsonResponse.feedback || {
            errors: [],
            suggestions: [
              "Good pronunciation overall!",
              "Try to emphasize the stress on longer words",
              "Practice the 'th' sound more"
            ]
          }
        };
      } catch (parseError) {
        // If JSON parsing fails, return a default response
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
        };
      }
    } catch (error) {
      console.error('Pronunciation analysis error:', error);
      return { 
        score: 0, 
        feedback: { 
          errors: ["Failed to analyze pronunciation"], 
          suggestions: ["Please try again later"] 
        } 
      };
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
