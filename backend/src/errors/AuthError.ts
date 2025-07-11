/**
 * this is an error that can be thrown and results in a failure message back
 * to the api (user error), but not treated internally as an error
 */
export class AuthError extends Error {

    code: number = 401;

    constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, AuthError);
    }
}
