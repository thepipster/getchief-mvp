/**
 * this is an error that can be thrown and results in a failure message back
 * to the api (user error), but not treated internally as an error
 */
export class ObjectNotFoundError extends Error {

    code: number = 404;

    object_type: string;
    object_id?: string;

    constructor(object_type: string, object_id?: string, ...args) {
        super(...args);

        if (!object_type || object_type === "") {
            throw Error("The object type must be specified.");
        }

        this.object_type = object_type;
        this.object_id = object_id;

        Error.captureStackTrace(this, ObjectNotFoundError);
    }

    public toString(): string {
        const with_id: string = (
            typeof this.object_id !== "undefined" && this.object_id !== null
                ? ` with id ${this.object_id}`
                : ""
        );
        return `The object of type ${this.object_type}${with_id} could not be found.`;
    }
}
