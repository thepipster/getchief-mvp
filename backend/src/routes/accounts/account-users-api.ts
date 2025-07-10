import { Response } from "express";
import StatusCodes from "http-status-codes";
import { ObjectNotFoundError } from "../../errors/ObjectNotFoundError";
import { Account } from "../../models/Account";
import { User } from "../../models/User";
import { OverdriveRequest } from "../OverdriveRequest";

export default class AccountUsersApi {
    static async extractUserAndAccountFromRequest(req: OverdriveRequest): Promise<{ user: User, account: Account }> {
        const ACCOUNT_ID = req.params.accountId;
        if (!ACCOUNT_ID) {
            throw new Error("The Account Id must be specified as a parameter to the request.");
        }

        const USER_ID = req.params.userId;
        if (!USER_ID) {
            throw new Error("The User Id must be specified as a parameter to the request.");
        }

        const account: Account | null = await Account.findOne({
            where: { id: ACCOUNT_ID },
        });
        if (!account) {
            throw new ObjectNotFoundError("Account", ACCOUNT_ID);
        }

        const user: User | null = await User.findOne({
            where: { id: USER_ID },
        });
        if (!user) {
            throw new ObjectNotFoundError("User", USER_ID);
        }

        return {
            user,
            account,
        };
    }

    public static async addUserToAccount(
        req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        const extracted = await AccountUsersApi.extractUserAndAccountFromRequest(req);

        if (!extracted.account.users) {
            extracted.account.users = [];
        }

        //account.users.push(user);
        extracted.user.account = extracted.account;

        await extracted.user.save();
        //await account.save();

        // return OK status code and loaded accounts array
        res.status(StatusCodes.CREATED).json({ account: extracted.account });
    }

    public static async removeUserFromAccount(
        req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        const extracted = await this.extractUserAndAccountFromRequest(req);

        // If the user belonged to this account, we have now unlinked them
        // If they did not, then they didn't belong to this account and that's
        // the state you wanted anyway
        if (extracted.user.accountId === extracted.account.id) {
            // unlink the user
            extracted.user.accountId = null;
            extracted.user.account = null;
            await extracted.user.save();
        }

        res.status(StatusCodes.NO_CONTENT).send();
    }
}
