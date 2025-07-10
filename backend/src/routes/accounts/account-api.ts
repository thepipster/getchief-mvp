import { Response } from "express";
import StatusCodes from "http-status-codes";
import { ObjectNotFoundError } from "../../errors/ObjectNotFoundError";
import { Account, AccountStatus } from "../../models/Account";
import { PricingUnit } from "../../models/PricingPolicy";
import { OverdriveRequest } from "../OverdriveRequest";
import { validateRequestHasSessionUserWithAccount } from "../integrations/ApiHelpers";

export type AccountUpdate = {
    avatar?: string;
    name?: string;
    status?: AccountStatus;
    masterPriceUnit?: PricingUnit;
    masterPrice?: number;
};

export default class AccountApi {
    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async getAccounts(
        _req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        // load all accounts
        const accounts: Account[] = await Account.find({});

        // return OK status code and loaded accounts array
        res.json({ accounts });
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async get(
        req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        validateRequestHasSessionUserWithAccount(req, true);

        if (req.sessionUser.account) {
            res.status(StatusCodes.OK).json(req.sessionUser.account);
        } else {
            res.status(StatusCodes.NO_CONTENT);
        }
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async update(
        req: OverdriveRequest,
        res: Response
    ): Promise<void> {
        // this route is for 'uber' admins only, they can modify anyone's account
        validateRequestHasSessionUserWithAccount(req, true);

        let account: Account | null = null;

        // NOTE: if accountId is not specified, then findOne returns the first one of 'any' account
        const ACCOUNT_ID: string = req.params.accountId;
        if (ACCOUNT_ID) {
            account = await Account.findOne({
                where: {
                    id: ACCOUNT_ID,
                },
            });
        }

        if (!account) {
            throw new ObjectNotFoundError("Account", ACCOUNT_ID);
        }

        // Update only the fields a account is allowed to update (and they can only update themselves!)
        const newAccount: AccountUpdate = req.body as AccountUpdate;

        let isDirty = false;

        if (newAccount.name) {
            account.name = newAccount.name;
            isDirty = true;
        }
        if (newAccount.avatar) {
            account.avatar = newAccount.avatar;
            isDirty = true;
        }
        if (newAccount.status) {
            account.status = newAccount.status;
            isDirty = true;
        }
        if (newAccount.masterPrice) {
            account.masterPrice = newAccount.masterPrice;
            isDirty = true;
        }
        if (newAccount.masterPriceUnit) {
            account.masterPriceUnit = newAccount.masterPriceUnit;
            isDirty = true;
        }

        if (isDirty) {
            account = await account.save();
        }

        // return OK status code and loaded accounts array
        res.json(account);
    }
}
