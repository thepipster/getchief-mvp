import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ClaudeRequestOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    systemPrompt?: string;
}

export class ClaudeApiHandler {
    private client: Anthropic;
    private defaultModel: string = 'claude-3-5-sonnet-20241022';
    private defaultMaxTokens: number = 4096;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('Claude API key is required');
        }
        
        this.client = new Anthropic({
            apiKey: apiKey,
        });
    }

    /**
     * Send a single message to Claude
     */
    async sendMessage(
        message: string,
        options: ClaudeRequestOptions = {}
    ): Promise<Anthropic.Messages.Message> {
        const messages: ClaudeMessage[] = [
            { role: 'user', content: message }
        ];

        return this.sendMessages(messages, options);
    }

    /**
     * Send a conversation (multiple messages) to Claude
     */
    async sendMessages(
        messages: ClaudeMessage[],
        options: ClaudeRequestOptions = {}
    ): Promise<Anthropic.Messages.Message> {
        try {
            const response = await this.client.messages.create({
                model: options.model || this.defaultModel,
                max_tokens: options.maxTokens || this.defaultMaxTokens,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                ...(options.temperature && { temperature: options.temperature }),
                ...(options.topP && { top_p: options.topP }),
                ...(options.topK && { top_k: options.topK }),
                ...(options.systemPrompt && { system: options.systemPrompt })
            });

            return response;
        } catch (error) {
            console.error('Error calling Claude API:', error);
            throw error;
        }
    }

    /**
     * Extract text content from Claude response
     */
    extractTextFromResponse(response: Anthropic.Messages.Message): string {
        if (!response.content || response.content.length === 0) {
            return '';
        }

        return response.content
            .filter((item: Anthropic.Messages.ContentBlock) => item.type === 'text')
            .map((item: Anthropic.Messages.TextBlock) => item.text)
            .join('');
    }

    /**
     * Send a message and get just the text response
     */
    async getTextResponse(
        message: string,
        options: ClaudeRequestOptions = {}
    ): Promise<string> {
        const response = await this.sendMessage(message, options);
        return this.extractTextFromResponse(response);
    }

    /**
     * Send messages and get just the text response
     */
    async getTextResponseFromMessages(
        messages: ClaudeMessage[],
        options: ClaudeRequestOptions = {}
    ): Promise<string> {
        const response = await this.sendMessages(messages, options);
        return this.extractTextFromResponse(response);
    }

    /**
     * Create a judge response for accuracy scoring
     */
    async judgeAccuracy(
        userQuestion: string,
        aiResponse: string,
        correctAnswer?: string,
        context?: string
    ): Promise<{ accuracyScore: number; explanation: string }> {
        let prompt = `You are an expert judge evaluating the accuracy of an AI response to a user question.

User Question: "${userQuestion}"

AI Response: "${aiResponse}"`;

        if (correctAnswer) {
            prompt += `\n\nCorrect Answer: "${correctAnswer}"`;
        }

        if (context) {
            prompt += `\n\nContext/Reference Material: "${context}"`;
        }

        prompt += `\n\nPlease evaluate the AI response and provide:
1. An accuracy score from 0.0 to 1.0 (where 1.0 is completely accurate)
2. A detailed explanation of your evaluation in markdown format

Respond in this exact JSON format:
{
    "accuracyScore": 0.85,
    "explanation": "## Evaluation\\n\\nThe response is mostly accurate because..."
}`;

        try {
            const response = await this.getTextResponse(prompt, {
                model: 'claude-3-5-sonnet-20241022',
                maxTokens: 1000,
                temperature: 0.1
            });

            // Try to parse JSON response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    accuracyScore: Math.max(0, Math.min(1, parsed.accuracyScore || 0)),
                    explanation: parsed.explanation || 'No explanation provided'
                };
            }

            // Fallback if JSON parsing fails
            return {
                accuracyScore: 0.5,
                explanation: `**Evaluation Error**: Could not parse judge response.\n\nRaw response: ${response}`
            };
        } catch (error: unknown) {
            console.error('Error in judgeAccuracy:', error);
            return {
                accuracyScore: 0,
                explanation: `**Error**: Failed to evaluate accuracy - ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Stream a response from Claude
     */
    async *streamMessage(
        message: string,
        options: ClaudeRequestOptions = {}
    ): AsyncGenerator<string, void, unknown> {
        const messages: ClaudeMessage[] = [
            { role: 'user', content: message }
        ];

        yield* this.streamMessages(messages, options);
    }

    /**
     * Stream a conversation response from Claude
     */
    async *streamMessages(
        messages: ClaudeMessage[],
        options: ClaudeRequestOptions = {}
    ): AsyncGenerator<string, void, unknown> {
        try {
            const stream = await this.client.messages.create({
                model: options.model || this.defaultModel,
                max_tokens: options.maxTokens || this.defaultMaxTokens,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                stream: true,
                ...(options.temperature && { temperature: options.temperature }),
                ...(options.topP && { top_p: options.topP }),
                ...(options.topK && { top_k: options.topK }),
                ...(options.systemPrompt && { system: options.systemPrompt })
            });

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                    yield chunk.delta.text;
                }
            }
        } catch (error) {
            console.error('Error streaming from Claude API:', error);
            throw error;
        }
    }

    /**
     * Test the API connection
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await this.sendMessage('Hello', {
                maxTokens: 10
            });
            return !!response.id;
        } catch (error) {
            console.error('Claude API connection test failed:', error);
            return false;
        }
    }

    /**
     * Set a new API key
     */
    setApiKey(apiKey: string): void {
        if (!apiKey) {
            throw new Error('API key cannot be empty');
        }
        
        this.client = new Anthropic({
            apiKey: apiKey,
        });
    }

    /**
     * Set default model
     */
    setDefaultModel(model: string): void {
        this.defaultModel = model;
    }

    /**
     * Set default max tokens
     */
    setDefaultMaxTokens(maxTokens: number): void {
        this.defaultMaxTokens = maxTokens;
    }

    /**
     * Get available models from Anthropic API
     */
    async getAvailableModels(): Promise<string[]> {
        try {
            const models = await this.client.models.list();
            return models.data.map((model: Anthropic.Models.Model) => model.id);
        } catch (error) {
            console.error('Error fetching models from Anthropic API:', error);
            // Fallback to static list if API call fails
            return this.getStaticModelList();
        }
    }

    /**
     * Get static list of available models as fallback
     */
    private getStaticModelList(): string[] {
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
    }

    /**
     * Get available models (static list) - kept for backward compatibility
     * @deprecated Use getAvailableModels() instead for live API data
     */
    static getStaticAvailableModels(): string[] {
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
    }

    /**
     * Get the underlying Anthropic client for advanced usage
     */
    getClient(): Anthropic {
        return this.client;
    }
}
