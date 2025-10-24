export interface ConversationMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface ConversationContext {
    language: string;
    level: string;
    topic?: string;
    personality?: string;
}
export interface DeepSeekResponse {
    content: string;
    suggestions?: string[];
    grammarCorrections?: GrammarCorrection[];
}
export interface GrammarCorrection {
    original: string;
    corrected: string;
    explanation: string;
    confidence: number;
}
export declare class DeepSeekService {
    private client;
    constructor(apiKey: string);
    generateConversation(messages: ConversationMessage[], context: ConversationContext): Promise<DeepSeekResponse>;
    checkGrammar(text: string, language: string): Promise<GrammarCorrection[]>;
    private buildSystemPrompt;
    private extractSuggestions;
    private extractGrammarCorrections;
    private parseGrammarResponse;
}
//# sourceMappingURL=ai.d.ts.map