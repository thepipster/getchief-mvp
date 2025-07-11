import { Request, Response } from 'express';
import { Logger } from '../utils/Logger';
import { ClaudeHelper, type ClaudeMessage, ClaudeDefualts } from "../services/ClaudeHelper"

export class ChatAPI {

    static async askAgent(req: Request, res: Response): Promise<void> {

        if (!req.body.query || req.body.query.trim() === '') {
            throw new Error('Query is required');
        }

        const { query, history, systemContext } = req.body;

        let webSearch = false;
        if (req.body.webSearch) {
            webSearch = true;
        }
        
        const client = new ClaudeHelper({
            systemContext: systemContext
        });

        // Create the chat history, and first just add the user query
        const chatHistory: ClaudeMessage[] = [];

        chatHistory.push({role: 'user', content: query.trim()});

        // If we have a history, add it to the chat history
        if (history && Array.isArray(history)) {
            history.forEach((message: ClaudeMessage) => {
                chatHistory.push({
                    role: message.role,
                    content: message.content
                });
            });
        }

        // Send the message to Claude!
        const claude: string = await client.sendMessage(chatHistory, webSearch);

        // Add claude's response to the chat history
        chatHistory.push({role: 'assistant', content: claude});

        res.json({response: claude, chatHistory: chatHistory});
    }


}

export default ChatAPI;
