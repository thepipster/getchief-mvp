/**
 * this is an error that can be thrown and results in a failure message back
 * to the api (user error), but not treated internally as an error
 */
export class UnprocessableEntityError extends Error {

    code: number = 422;

    message: string;

    constructor(message: string, ...args) {
        super(...args);

        if (!message) {
            throw Error("The message must be specified.");
        }

        this.message = message;

        Error.captureStackTrace(this, UnprocessableEntityError);
    }

    public toString(): string {
        return this.message;
    }
}
