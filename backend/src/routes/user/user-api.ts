import { NextFunction, Response } from "express";
import { User, UserPreferences, UserRole, UserStatus } from "../../models/User";
import { Logger } from "../../utils/Logger";
import { OverdriveRequest } from "../OverdriveRequest";
import { validateRequestHasSessionUserWithAccount } from "../integrations/ApiHelpers";
import { ObjectNotFoundError } from "../../errors/ObjectNotFoundError";
import { patchObject } from "../../utils/ObjectUtils";

export type UserUpdate = {
    preferences?: UserPreferences;
    name?: string;
    role?: UserRole;
    avatar?: string;
    status?: UserStatus;
};

export default class UserApi {
    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async loadUser(
        req: OverdriveRequest,
        _res: Response,
        next: NextFunction
    ): Promise<void> {
        if (!req.params?.userId) {
            throw new Error("The userId must be specified in the Path.");
        }

        const retrieved_user: User | null = await User.findOne({
            where: {
                id: req.params!.userId
            },
        });

        if (!retrieved_user) {
            throw new ObjectNotFoundError("User", req.params.userId);
        }

        req.user = retrieved_user;

        next();
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    /**
     * Load ALL users
     * @param req
     * @param res
     */
    public static async searchUsers(
        _req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        const users: User[] = await User.find({});
        res.json({ users });
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async getAccountUsers(
        req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        validateRequestHasSessionUserWithAccount(req);

        Logger.debug(`Getting users for account ${req.sessionUser!.account.id}`);
        // load all users (for the current account)
        const users: User[] = await User.find({
            where: {
                accountId: req.sessionUser!.account.id,
            },
        });

        //let fbUsers = await FirebaseHelper.getAllUsers();

        // return OK status code and loaded users array
        res.json({ users });
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async getMe(
        req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        res.json(req.sessionUser);
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async get(
        req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        res.json(req.user);
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async delete(
        req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        const user: User = req.user;
        user.status = UserStatus.deleted;
        await user.save();

        //await User.update({})
        /*
        await User
            .createQueryBuilder()
            .update(User)
            .set({ status: UserStatus.deleted })
            .where("id = :id", { id: 1 })
            .execute();
        */

        // return OK status code and loaded users array
        res.json(user);
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async update(
        req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        if (!req.user) {
            throw new Error("The request lacks a user.");
        }

        // Update only the fields a user is allowed to update (and they can only update themselves!)
        const FIELDS: Array<string> = [
            "preferences",
            "name",
            "status",
            "role",
            "avatar",
        ];
        if (patchObject(req.user, req.body, FIELDS)) {
            req.user = await req.user.save();
        }

        // return OK status code and loaded users array
        res.json(req.user);
    }
}
