import _ from "lodash"
import BaseModel from "./BaseModel"
import { type ChunkingConfig, ChunkingStrategy } from "../types/domain"

export class Domain {

    id: number = 0;
    name: string = "Knowledge Base";
    description: string = "";
    chunkingStrategy: ChunkingStrategy = ChunkingStrategy.FIXED_SIZE;
    chunkingConfig: ChunkingConfig = {
        strategy: ChunkingStrategy.FIXED_SIZE,
        chunkSize: 1000,
        chunkOverlap: 200
     };

    constructor(options: {
        id?: number
        name?: string
        description?: string
        chunkingStrategy?: ChunkingStrategy
        chunkingConfig?: ChunkingConfig
    }) {

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
            if (options.chunkingStrategy) {
                this.chunkingStrategy = options.chunkingStrategy;
            }
            if (options.chunkingConfig) {
                this.chunkingConfig = { ...options.chunkingConfig };
            }
        }

    }

    async load(): Promise<void> {
        const info = await BaseModel.__send({verb: "get", path: `domain/${this.id.toString()}`});
        _.assign(this, info);
    }

    async save(): Promise<void> {
        if (this.id == 0) {
            await Domain.create(this);
        }
        else {
            await this.update();
        }
    }

    async update(): Promise<void> {
        await BaseModel.__send({verb: "put", path: `domain/${this.id.toString()}`, data: this});
    }

    static async getAll(): Promise<Domain[]> {
        let info = await BaseModel.__send({verb: "get", path: "domain"});
        return info.map((i: any) => new Domain(i));
    }

    static async get(id: number): Promise<Domain> {
        const info = await BaseModel.__send({verb: "get", path: `domain/${id.toString()}`});
        return new Domain(info);
    }

    static async create(domain: Domain): Promise<Domain> {
        const info = await BaseModel.__send({verb: "post", path: "domain", data: domain});
        return new Domain(info);
    }

    static async delete(id: number): Promise<void> {
        return await BaseModel.__send({verb: "delete", path: `domain/${id.toString()}`});
    }
}
