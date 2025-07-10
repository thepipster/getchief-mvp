import _ from "lodash"
import BaseModel from "./BaseModel"

export interface PineconeMatch {
    id: string;
    score: number;
    metadata?: {
        text: string;
        source?: string;
        title?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
}

interface PineconeQueryResult {
    matches: PineconeMatch[];
}


export class Rag {

    static async search(query: string, domainId: number, rerank: boolean = false): Promise<PineconeMatch[]> {
        const results: PineconeQueryResult = await BaseModel.__send({
            verb: "post",
            path: `domain/${domainId}/search`,
            data: {rerank, query}
        }) as PineconeQueryResult;
        return results.matches
    }

}
