import Anthropic from '@anthropic-ai/sdk';
import {Logger} from '../utils/Logger';
import _ from "lodash";

export type ClaudeOptions = {
    model?: string,
    maxTokens?: number,
    temperature?: number,
    systemContext?: string
}

export const ClaudeDefualts = {
    model: "claude-opus-4-20250514",
    maxTokens: 4096,
    temperature: 0.7,
    systemContext: "You are a helpful assistant. If you do not know the answer, just say so. And try to give a confidence score with your answer."
}

export type ClaudeMessage = {
    role: "user" | "assistant" | "system";
    content: string;
}

/**
 * @see https://www.npmjs.com/package/@anthropic-ai/sdk
 */
export class ClaudeHelper {
    
    private anthropic: Anthropic;
    private config: ClaudeOptions = ClaudeDefualts;

    constructor(opts?: ClaudeOptions) {
        
        Logger.debug("Initializing ClaudeHelper", opts);

        if (opts) {
            this.config = _.merge({}, ClaudeDefualts, opts); // _.defaults(ClaudeDefualts, opts);
        }

        Logger.debug("Assigned options to  ClaudeHelper", this.config);

        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

    }

    async sendMessage(messages: ClaudeMessage[], webSearch?: boolean) : Promise<string> {
        
        let opts:any = {
            model: this.config.model,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            system: [
                {
                  "text": this.config.systemContext,
                  "type": "text"
                }
            ],
            messages: messages.map(msg => ({
                role: msg.role === "system" ? "assistant" : msg.role,
                content: msg.content
            })),
        };

        if (webSearch) {
            opts.tools=[
                {
                    "type": "web_search_20250305",
                    "name": "web_search"
                }
            ]
        }

        Logger.debug("Sending message to Claude", opts)
        const msg = await this.anthropic.messages.create(opts);

        // Handle the ContentBlock union type (TextBlock | ThinkingBlock)
        const firstBlock = msg.content[0];
        if (firstBlock.type === 'text') {
            return firstBlock.text;
        } else {
            // Handle ThinkingBlock or other types
            return 'No text content available';
        }
    }
}
