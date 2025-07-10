
export type MessageData = {
    id?: number,
    userId?: number,
    agentId?: number,
    domainId?: number,
    role?: string,
    type?: string,
    content: string
}

export class Message {

    id: number = 0;
    agentId: number = 0;
    domainId: number = 0;
    userId: number = 0;
    role: string = "user";
    type: string = "text";
    content: string = "";

    constructor(options?: MessageData) {
        if (options) {
            if (options.id) {
                this.id = options.id;
            }
            if (options.agentId) {
                this.agentId = options.agentId;
            }
            if (options.domainId) {
                this.domainId = options.domainId;
            }
            if (options.role) {
                this.role = options.role;
            }
            if (options.type) {
                this.type = options.type;
            }
            if (options.content) {
                this.content = options.content;
            }
            if (options.userId) {
                this.userId = options.userId;
            }
        }
    }


}
