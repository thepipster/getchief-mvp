import * as _ from "lodash"
import BaseModel from "./BaseModel"

type AgentData = {
    id?: number;
    name?: string;
    description?: string;
    context?: string;
}

export type AgentMessage = {
    role: string; // 'user' | 'assistant' | 'system';configuration
    content: string;
    context?: string; // Optional context for RAG
    timestamp?: string; // Optional timestamp
}

export type AgentChatPayload = {
    content: string;
    context?: string;
    history?: AgentMessage[];
}

export class Agent {

    id: number = 0;
    name: string = "";
    description: string = "";
    context: string = "";
    messages: AgentMessage[] = [];
    private lastResponse: string = "";

    constructor(options?: AgentData) {
        if (options) {
            if (options.id) {
                this.id = options.id;
            }
            if (options.name) {
                this.name = options.name;
            }
            if (options.description) {
                this.description = options.description;
            }
            if (options.context) {
                this.context = options.context;
            }
        }
    }

    async load(agentId: number): Promise<void> {
        const info = await BaseModel.__send({verb: "get", path: `agent/${agentId}`});
        _.assign(this, info);
    }

    async save(): Promise<void> {
        let info: any;
        if (this.id == 0) {
            info = await BaseModel.__send({verb: "post", path: "agent", data: {
                name: this.name,
                description: this.description,
                context: this.context
            }});
        }
        else {
            info = await BaseModel.__send({verb: "put", path: `agent/${this.id}`, data: {
                name: this.name,
                description: this.description,
                context: this.context
            }});
        }
        this.id = info.id;
        this.name = info.name;
        this.description = info.description;
    }

    clearChatHistory() {
        this.messages = [];
    }

    getChatHistory(): AgentMessage[] {
        return this.messages;
    }

    getLastAgentResponse(): string {
        return this.lastResponse;
        //const agentMessages = this.messages.filter(msg => msg.role === 'assistant');
        //return agentMessages.length > 0 ? agentMessages[agentMessages.length - 1].content : "";
    }

    async delete(): Promise<void> {
        await BaseModel.__send({verb: "delete", path: `agent/${this.id}`});
    }

    /**
     * Send a qustion to the agent (the LLM) and get a response. The agent keeps track of the chat history.
     * @param content The user question
     * @param context (optional) Additional context to provide to the agent, e.g. results of a RAG search.
     * @returns The agent's response
     */
    async ask(content: string, context: string = ""): Promise<string> {

        if (!content || content.trim() === '') {
            throw new Error('User question cannot be empty');
        }

        if (!this.id) {
            throw new Error("You must load or create the agent before sending a message.");
        }

        try {

            // Add the user message to the chat history
            this.messages.push({
                role: "user",
                content,
                context,
                timestamp: new Date().toISOString()
            });

            const payload = {
                content: content.trim(),
                context,
                history: this.messages
            };

            type ChatResponse = {
                response: string,
                model: string,
                chatHistory: AgentMessage[],
                time: number,
                systemContent: string
            }

            const agentResp: ChatResponse = await BaseModel.__send({verb: "post", path: `agent/${this.id}/ask`, data: payload}) as ChatResponse;

            // res.json({response: claude, time: end - start, model: client.getModelId(), chatHistory: chatHistory, systemContent: sysContent});
            //this.messages = agentResp.chatHistory || [];
            //this.messages.push({role: "system", content: agentResp.systemContent || ""});
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

    static async generciAsk(content: string, context?: string): Promise<string> {

        try {

            const payload = {
                content: content.trim(),
                context
            };

            type ChatResponse = {
                response: string,
                model: string,
                chatHistory: AgentMessage[],
                time: number,
                systemContent: string
            }

            const agentResp: ChatResponse = await BaseModel.__send({verb: "post", path: `agent/ask`, data: payload}) as ChatResponse;

            return agentResp?.response;
        }
        catch(error){
            console.error("Error creating message:", error);
            throw new Error("Failed to create message");
        }

    }


    static async getAll(): Promise<Agent[]> {
        const info = await BaseModel.__send({verb: "get", path: "agent"});
                console.log("Agent loaded:", info);

        return Array.isArray(info) ? info.map((i: AgentData) => new Agent(i)) : [];
    }

    static async get(id: number): Promise<Agent> {
        const info = await BaseModel.__send({verb: "get", path: `agent/${id}`});
        return new Agent(info as AgentData);
    }

    static async create(agent: Agent): Promise<Agent> {
        const info = await BaseModel.__send({verb: "post", path: "agent", data: {
            name: agent.name,
            description: agent.description,
            context: agent.context
        }});
        return new Agent(info as AgentData);
    }


}
