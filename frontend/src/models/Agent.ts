import * as _ from "lodash"
import BaseModel from "./BaseModel"

type AgentMessage = {
    role: string; // 'user' | 'assistant' | 'system';configuration
    content: string;
    context?: string; // Optional context for RAG
    timestamp?: string; // Optional timestamp
}

export class Agent {

    name: string = "Claude Bot";
    systemContext: string = "You are a helpful assistant. If you do not know the answer, just say so. And try to give a confidence score with your answer.";
    messages: AgentMessage[] = [];
    private lastResponse: string = "";

    constructor(options?: {name: string, systemContext: string}) {
        if (options) {
            if (options.name) {
                this.name = options.name;
            }
            if (options.systemContext) {
                this.systemContext = options.systemContext;
            }
        }
        console.log(`Created agent ${this.name} with system context: ${this.systemContext}`)
    }

    clearHistory() {
        this.messages = [];
    }

    setSystemContext(context: string) {
        this.systemContext = context;
    }

    setName(name: string) {
        this.name = name;
    }

    /**
     * Send a qustion to the agent (the LLM) and get a response. The agent keeps track of the chat history.
     * @param query The user question
     * @param context (optional) Additional context to provide to the agent, e.g. results of a RAG search.
     * @returns The agent's response
     */
    async ask(query: string, context: string = ""): Promise<string> {

        if (!query || query.trim() === '') {
            throw new Error('User question cannot be empty');
        }

        try {

            // Add the user message to the chat history
            this.messages.push({
                role: "user",
                content: query,
                context,
                timestamp: new Date().toISOString()
            });

            const payload = {
                query: query.trim(),
                systemContext: this.systemContext,
                history: this.messages
            };

            console.log(`Sending query to agent ${this.name}: ${query}`, payload);

            type ChatResponse = {
                response: string,
                model: string,
                chatHistory: AgentMessage[],
                time: number,
                systemContent: string
            }

            const agentResp: ChatResponse = await BaseModel.__send({verb: "post", path: `agent/ask`, data: payload}) as ChatResponse;

            // Add response to history
            this.messages.push({role: "assistant", content: agentResp.response || ""});

            // Store the last response
            this.lastResponse = agentResp?.response;
            return this.lastResponse;
        }
        catch(error){
            console.error("Error creating message:", error);
            throw new Error("Failed to create message");
        }

    }
}
