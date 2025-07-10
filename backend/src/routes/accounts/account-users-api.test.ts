import { getMockReq, getMockRes } from "@jest-mock/express"; // https://www.npmjs.com/package/@jest-mock/express
import { v4 as uuidv4 } from "uuid";
import { DatabaseHelper } from "../../config";
import { ObjectNotFoundError } from "../../errors/ObjectNotFoundError";
import { Account } from "../../models/Account";
import { User } from "../../models/User";
import { TestContext, withTestContext } from "../../utils/TestUtils.test";
import { OverdriveRequest } from "../OverdriveRequest";
import AccountUsersApi from "./account-users-api";

describe("/src/routes/user/account-users-api", () => {
    beforeAll(async () => {
        await DatabaseHelper.connect();
    });

    afterAll(async () => {
        await DatabaseHelper.close();
    });

    it("reports an error when you don't specify a user id when adding a user to an account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET_ACCOUNT: Account = await ctx.createAccountInDatabase();

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    accountId: TARGET_ACCOUNT.id,
                }
            });

            expect(AccountUsersApi.addUserToAccount(req, res))
                .rejects.
                toThrow(new Error("The User Id must be specified as a parameter to the request."));
        });
    });

    it("reports an error when you specify a non-existing user id when adding a user to an account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET_ACCOUNT: Account = await ctx.createAccountInDatabase();
            const USER_ID: string = uuidv4();

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    accountId: TARGET_ACCOUNT.id,
                    userId: USER_ID,
                }
            });

            expect(AccountUsersApi.addUserToAccount(req, res))
                .rejects.
                toThrow(new ObjectNotFoundError("User", USER_ID));
        });
    });

    it("reports an error when you don't specify a account id when adding a user to an account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET_USER: User = await ctx.createUserInDatabase();
            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    userId: TARGET_USER.id,
                }
            });

            expect(AccountUsersApi.addUserToAccount(req, res))
                .rejects.
                toThrow(new Error("The Account Id must be specified as a parameter to the request."));
        });
    });

    it("reports an error when you specify a non-existing account id when adding a user to an account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET_USER: User = await ctx.createUserInDatabase();
            const ACCOUNT_ID: string = uuidv4();
            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    accountId: ACCOUNT_ID,
                    userId: TARGET_USER.id,
                }
            });

            expect(AccountUsersApi.addUserToAccount(req, res))
                .rejects.
                toThrow(new ObjectNotFoundError("Account", ACCOUNT_ID));
        });
    });

    it("adds an existing user to an account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET_USER: User = await ctx.createUserInDatabase();
            const TARGET_ACCOUNT: Account = await ctx.createAccountInDatabase();
            const { res } = getMockRes({
            });
            const req = getMockReq<OverdriveRequest>({
                params: {
                    userId: TARGET_USER.id,
                    accountId: TARGET_ACCOUNT.id,
                }
            });

            await AccountUsersApi.addUserToAccount(req, res);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    account: {
                        users: [],
                        ...TARGET_ACCOUNT
                    },
                })
            );

            // Validate the database contains the change
            const ACTUAL = await User.findOne({
                where: {
                    id: TARGET_USER.id,
                    accountId: TARGET_ACCOUNT.id,
                }
            });
            expect(ACTUAL).not.toBeNull();
            expect(ACTUAL!.id).toEqual(TARGET_USER.id);
        });
    });

    it("reports an error when you don't specify a user id when removing a user from an account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET_ACCOUNT: Account = await ctx.createAccountInDatabase();

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    accountId: TARGET_ACCOUNT.id,
                }
            });

            expect(AccountUsersApi.removeUserFromAccount(req, res))
                .rejects.
                toThrow(new Error("The User Id must be specified as a parameter to the request."));
        });
    });

    it("reports an error when you specify a non-existing user id when removing a user from an account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET_ACCOUNT: Account = await ctx.createAccountInDatabase();
            const USER_ID: string = uuidv4();

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    accountId: TARGET_ACCOUNT.id,
                    userId: USER_ID,
                }
            });

            expect(AccountUsersApi.removeUserFromAccount(req, res))
                .rejects.
                toThrow(new ObjectNotFoundError("User", USER_ID));
        });
    });

    it("reports an error when you don't specify a account id when removing a user from an account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET_USER: User = await ctx.createUserInDatabase();
            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    userId: TARGET_USER.id,
                }
            });

            expect(AccountUsersApi.removeUserFromAccount(req, res))
                .rejects.
                toThrow(new Error("The Account Id must be specified as a parameter to the request."));
        });
    });

    it("reports an error when you specify a non-existing account id when removing a user from an account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET_USER: User = await ctx.createUserInDatabase();
            const ACCOUNT_ID: string = uuidv4();
            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    accountId: ACCOUNT_ID,
                    userId: TARGET_USER.id,
                }
            });

            expect(AccountUsersApi.removeUserFromAccount(req, res))
                .rejects.
                toThrow(new ObjectNotFoundError("Account", ACCOUNT_ID));
        });
    });

    it("removes a existing member user from an existing account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET_USER: User = await ctx.createUserInDatabase();
            const TARGET_ACCOUNT: Account = await ctx.createAccountInDatabase();

            TARGET_USER.accountId = TARGET_ACCOUNT.id;
            await TARGET_USER.save();

            // validate the user is in the right state
            const VALIDATED: User | null = await User.findOne({ where: { id: TARGET_USER.id, accountId: TARGET_ACCOUNT.id } });
            expect(VALIDATED).not.toBeNull();
            expect(VALIDATED!.id).toEqual(TARGET_USER.id);

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    accountId: TARGET_ACCOUNT.id,
                    userId: TARGET_USER.id,
                }
            });
            await AccountUsersApi.removeUserFromAccount(req, res);

            // Validate the database contains the change
            const ACTUAL = await User.findOne({
                where: {
                    id: TARGET_USER.id,
                    accountId: TARGET_ACCOUNT.id,
                }
            });
            expect(ACTUAL).toBeNull();
        });
    });
});
