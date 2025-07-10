
import { Rag, type PineconeMatch } from '../models/Rag';
import { Agent, type AgentMessage } from '../models/Agent';
import _ from 'lodash';

export type PromptHelperOptions = {
    maxContextLength?: number;
    includeScores?: boolean;
    domainId?: number;
    modelVendor?: string; // e.g., 'openai', 'anthropic'
}

export type JudgeResponse = {
    accuracyScore: number; // 0 to 1
    explanation: string; // markdown formatted explanation
}

export class PromptHelper {

    private options: PromptHelperOptions = {
        maxContextLength: 4000,
        includeScores: false,
        domainId: 1,
        modelVendor: 'antrophic'
    };
    private userQuestion: string = '';
    private ragResults: PineconeMatch[] = [];

    constructor(options?: PromptHelperOptions) {
        this.options = _.defaults(this.options, options);
    }

    setRagResults(ragResults: PineconeMatch[]) {
        this.ragResults = ragResults;
    }

    getRagResults(): PineconeMatch[] {
        return this.ragResults;
    }

    setUseScores(includeScores: boolean) {
        this.options.includeScores = includeScores;
    }

    setMaxContextLength(maxContextLength: number) {
        this.options.maxContextLength = maxContextLength;
    }

    setDomainId(domainId: number) {
        this.options.domainId = domainId;
    }

    /**
     * Perform a RAG search using the user's question.
     * @param userQuestion The user question to do a rag search
     * @returns
     */
    updateRag = async (userQuestion: string): Promise<PineconeMatch[]> => {
        if (userQuestion) {
            this.userQuestion = userQuestion;
        }
        this.ragResults = await Rag.search(this.userQuestion, this.options.domainId || 1);
        return this.ragResults
    }

    /**
     * Take the user question and Pinecone RAG results and build a context string
     * @param userQuestion The user's question
     * @param ragResults Results from Pinecone RAG search
     * @returns
     */
    getContext(): string {

        if (!this.ragResults || this.ragResults.length === 0) {
            console.warn(`No relevant context found for your question: "${this.userQuestion}". Please try asking something else.`);
            return this.userQuestion;
        }

        const maxLength = this.options.maxContextLength || 4000;
        const includeScores = this.options.includeScores || false;

        // Build context from Pinecone matches
        let context = '';
        let currentLength = 0;

        for (let i = 0; i < this.ragResults.length; i++) {
            const match: PineconeMatch = this.ragResults[i];

            //Logger.debug(`Processing match ${i + 1}/${pineconeResults.matches.length}... ID: ${match.id}, Score: ${match.score}`);

            if (match && match.metadata) {
                // Format each piece of context
                const scoreText = includeScores ? ` (Relevance: ${match.score.toFixed(3)})` : '';
                const sourceText = match.metadata.source ? `[Source: ${match.metadata.source}]` : `[ID: ${match.id}]`;

                let contextPiece = `${sourceText}${scoreText}\n\n${match.metadata.text}\n\n---\n\n`;

                // Check if adding this would exceed length limit
                if (currentLength + contextPiece.length > maxLength) {
                    contextPiece = contextPiece.substring(0, maxLength);
                }

                context += contextPiece;
                currentLength += contextPiece.length;
            } else {
                console.error(`ERROR: Processing match ${i + 1}/${this.ragResults.length}... ID: ${match.id}, Score: ${match.score}`, match);
            }
        }

        return context.trim();
    }

    getPrompt(): string {
        const context = this.getContext();

        // Build the final prompt
        const fullPrompt = `CONTEXT INFORMATION:\n\n${context}\n\nUSER QUESTION: ${this.userQuestion}\n\nPlease answer based on the context above:`;

        return fullPrompt;
    }


    async askAgent(userQuestion: string, agent:Agent, useRag:boolean = true): Promise<string> {

        if (!userQuestion || userQuestion.trim() === '') {
            throw new Error('User question cannot be empty');
        }

        this.userQuestion = userQuestion;
        let agentResponse: string = "";

        if (useRag){
            await this.updateRag(userQuestion);
            console.log(`RAG found ${this.ragResults.length} relevant documents for your question.`);
            console.log(`Sending ${userQuestion} with context`, this.getContext())
            agentResponse = await agent.ask(userQuestion, this.getContext());
        }
        else {
            agentResponse = await agent.ask(userQuestion);
        }

        return agentResponse;
    }


    async askJudge(agent:Agent): Promise<JudgeResponse> {

        // Get the last response for the agent
        const agentResponse = agent.getLastAgentResponse();

        if (!agentResponse || agentResponse.trim() === '') {
            throw new Error(`No responses found for agent ${agent.name}. Cannot judge.`);
        }

        const context = this.getContext();

        // Build the final prompt
        const fullPrompt = `CONTEXT INFORMATION:\n\n${context}\n\nUSER QUESTION: ${this.userQuestion}\n\nGiven the user question and context,
evaluate the following LLM response for accuracy against that context: ${agentResponse}`;

        const systemContext = `Your are the judget of accuracy of responses from AI agents. You will be given a user
question, context information and an AI response. Your task is to evaluate the response for accuracy against the context
information provided. Give the accuracy score as a number between 0 and 1, where 0 means completely inaccurate and 1 means completely accurate. Return in
valid JSON format that can be parsed with JSON.parse. Return the accuracy score and an explanation of your evaluation. Use markdown formatting for the explanation. Do not include any other text or comments.`;

        //return {content: fullPrompt, context: systemContext};

        let response = await Agent.generciAsk(fullPrompt, systemContext);

        //console.log(`Judge response for agent ${agent.name}:`, response);

        response = response.replace('```json', '');
        response = response.replace('```', '');
        const respObj = JSON.parse(response);

        return {
            accuracyScore: respObj.accuracy_score || 0,
            explanation: respObj.explanation || ''
        }

    }




}
