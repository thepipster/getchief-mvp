const appStartedDate = new Date();
import { Request, Response } from "express";
import * as requestIp from "request-ip";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ver = require("../../package.json").version;

export class StatusApi {
    public static async get(req: Request, res: Response): Promise<void> {
        res.json({
            commit: process.env.COMMIT_ID || null,
            started: appStartedDate,
            uptime: (Date.now() - Number(appStartedDate)) / 1000,
            version: ver,
            host: req.get("host"),
            ip: requestIp.getClientIp(req),
            headers: req.headers,
        });
    }
}
