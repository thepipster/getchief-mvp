import { NextFunction, Request, Response } from "express";
import { AuthError } from "../errors/AuthError";
import { Logger } from "../utils/Logger";

const USER_API_KEYS = ["72ca5e1e-ddf2-4c5a-86f2-00461cdbfc10"];
const ADMIN_API_KEYS = ["72ca5e1e-ddf2-4c5a-86f2-00461cdbfc10"];

export class AuthAPI {

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static isUser(req: Request, res: Response, next: NextFunction): void {
        if (USER_API_KEYS.includes(req.headers['x-api-key'] as string)) {
            next();
        } 
        else if (ADMIN_API_KEYS.includes(req.headers['x-api-key'] as string)) {
            next();
        }         
        else {
            Logger.error("authentication failed (not user)");
            throw new AuthError("authentication failed");
        }
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static isAdmin(req: Request, res: Response, next: NextFunction): void {
        if (ADMIN_API_KEYS.includes(req.headers['x-api-key'] as string)) {
            next();
        } 
        else {
            Logger.error("authentication failed (not admin)");
            throw new AuthError("authentication failed");
        }
    }

}
