import { NextFunction, Response } from "express";
import { AuthError } from "../../errors/AuthError";
import { Account } from "../../models/Account";
import { User, UserRole, UserStatus } from "../../models/User";
import { FirebaseHelper } from "../../services/FirebaseHelper";
import { Logger } from "../../utils/Logger";
import { OverdriveRequest } from "../OverdriveRequest";

export default class AuthAPI {
    // ///////////////////////////////////////////////////////////////////////////////////////

    private static async checkToken(
        req: OverdriveRequest,
        _res: Response
    ): Promise<void> {
        let token: string | null = null;

        if (req.headers.authorization) {
            token = req.headers.authorization.replace("Bearer ", "");
        }

        const accountId: string = req.headers["x-account-id"] as string;

        if (!token) {
            Logger.error("authentication failed (no token)");
            throw new AuthError("authentication failed (no token)");
        }

        let profile = null;

        // Get the profile from firebase
        try {
            profile = await FirebaseHelper.verifyIdToken(token);
        } catch (err) {
            //throw new AuthError("authentication failed (bad token)");
            Logger.error("Error verifying token", err);
            //Logger.error("token = ", token);
            throw new AuthError("authentication failed (bad token)");
        }

        if (!profile || !profile.email) {
            Logger.error("Error, profile is null", profile);
            throw new AuthError("authentication failed (no profile)");
        }

        // Load user from our database
        let user = await User.findOne({
            where: {
                email: profile.email,
            },
            relations: {
                account: true,
            },
        });

        if (!user) {
            Logger.debug(`Creating user ${profile.email}`);
            user = await new User();
            user.avatar = profile.picture;
            user.email = profile.email;
            user.name = profile.name;
            user.status = UserStatus.pending;
            await user.save();
        }

        // If the user is an uberAdmin, then this user can modify and work with _any_ account
        // So we will associate the sessionUser with whatever the account is that they want to access
        // (i.e. you ask for account foo, and you're an uber-admin? You get access to account foo!!)
        if (accountId && user.role == UserRole.uberAdmin) {
            user.account = await Account.findOne({ where: { id: accountId } });
        }

        if (user.status != UserStatus.active) {
            throw new AuthError("authentication failed (user not active)");
        }

        // Check this user has access to this account
        //if (!user.account || (user.account && user.account.id != accountId)){
        //    throw new AuthError("authentication failed (wrong account)");
        //}

        // Add to the state for downstream middleware
        req.sessionUser = user;

        return;
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async isUser(
        req: OverdriveRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        await AuthAPI.checkToken(req, res);
        if (req.sessionUser) {
            next();
        } else {
            Logger.error("authentication failed (unknown)");
            throw new AuthError("authentication failed (wrong account)");
        }
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async isAdmin(
        req: OverdriveRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        await AuthAPI.checkToken(req, res);

        if (
            req.sessionUser &&
            (req.sessionUser.role == UserRole.admin ||
                req.sessionUser.role == UserRole.uberAdmin)
        ) {
            next();
        } else {
            Logger.error("authentication failed (not admin)");
            throw new AuthError("authentication failed (not admin)");
        }
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async isUber(
        req: OverdriveRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        await AuthAPI.checkToken(req, res);

        if (req.sessionUser && req.sessionUser.role == UserRole.uberAdmin) {
            next();
        } else {
            Logger.error("authentication failed (not uber admin)");
            throw new AuthError("authentication failed (not uber admin)");
        }
    }

    // ///////////////////////////////////////////////////////////////////////////////////////
    /*
        export function isAuthorized(opts: { hasRole: Array<'admin' | 'manager' | 'user'>, allowSameUser?: boolean }) {
            return (req: Request, res: Response, next: Function) => {
                const { role, email, uid } = res.locals
                const { id } = req.params

                if (opts.allowSameUser && id && uid === id)
                    return next();

                if (!role)
                    return res.status(403).send();

                if (opts.hasRole.includes(role))
                    return next();

                return res.status(403).send();
            }
         }
         */
}
