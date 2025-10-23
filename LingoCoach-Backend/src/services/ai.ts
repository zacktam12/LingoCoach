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

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com/v1'
    })
  }

  async generateConversation(
    messages: ConversationMessage[],
    context: ConversationContext
  ): Promise<DeepSeekResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context)
      
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000
      })

      const content = response.choices[0]?.message?.content || ''
      
      return {
        content,
        suggestions: this.extractSuggestions(content),
        grammarCorrections: this.extractGrammarCorrections(content)
      }
    } catch (error) {
      console.error('DeepSeek API error:', error)
      throw new Error('Failed to generate conversation')
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
}
