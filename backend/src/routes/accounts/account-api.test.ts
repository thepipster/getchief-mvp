process.env.PORT = `${2000 + Math.floor(Math.random() * 10000)}`;
//jest.useFakeTimers()
import { getMockReq, getMockRes } from "@jest-mock/express"; // https://www.npmjs.com/package/@jest-mock/express
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from "uuid";
import { DatabaseHelper } from "../../config";
import { ObjectNotFoundError } from "../../errors/ObjectNotFoundError";
import { Account } from "../../models/Account";
import { User } from "../../models/User";
import { TestContext, withTestContext } from "../../utils/TestUtils.test";
import { OverdriveRequest } from "../OverdriveRequest";
import AccountApi from "./account-api";

describe("/src/routes/user/account-api", () => {
    beforeAll(async () => {
        await DatabaseHelper.connect();
    });

    afterAll(async () => {
        await DatabaseHelper.close();
    });

    it("checks that retrieving my account when I don't have one yields no content", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                sessionUser: await ctx.createUserInDatabase(),
            });

            await AccountApi.get(req, res);
            expect(res.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    it("ensures that an uber-admin calling update requires that the account exists in the database", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const USER: User = await ctx.createUserInDatabase();
            const INVALID_ACCOUNT_ID: string = uuidv4();

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                sessionUser: USER,
                params: {
                    id: INVALID_ACCOUNT_ID,
                }
            });

            expect(AccountApi.update(req, res)).rejects.toThrow(new ObjectNotFoundError("Account", INVALID_ACCOUNT_ID));
        });
    });

    it("gets my account", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const ACCOUNT: Account = await ctx.createAccountInDatabase();
            ACCOUNT.avatar = uuidv4();
            ACCOUNT.save();
            const USER: User = await ctx.createUserInDatabase(ACCOUNT);

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                sessionUser: USER,
            });

            await AccountApi.get(req, res);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: USER.account.name,
                    avatar: USER.account.avatar,
                    status: USER.account.status,
                })
            );
        });
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    it("get all accounts (must be uber-admin)", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const USER: User = await ctx.createUserInDatabase();

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                sessionUser: USER,
            });

            const CREATED_ACCOUNTS: Array<Account> = [];
            let remaining: number = 2; //Math.random() * 2;
            while (remaining > 0) {
                CREATED_ACCOUNTS.push(await ctx.createAccountInDatabase());
                remaining--;
            }

            await AccountApi.getAccounts(req, res);

            const EXPECTED_RESULT: Array<object> = [];
            CREATED_ACCOUNTS.forEach((a) => {
                EXPECTED_RESULT.push(
                    expect.objectContaining({
                        id: a.id,
                        name: a.name,
                        avatar: a.avatar,
                    })
                );
            });

            expect(res.json).toHaveBeenCalledWith({
                accounts: expect.arrayContaining(EXPECTED_RESULT)
            });
        });
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    it("updates an account (must be admin)", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const USER: User = await ctx.createUserInDatabase();
            const ACCOUNT: Account = await ctx.createAccountInDatabase();

            const EXPECTED_NAME: string = uuidv4();
            const EXPECTED_AVATAR: string = uuidv4();

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    accountId: ACCOUNT.id,
                },
                body: {
                    name: EXPECTED_NAME,
                    avatar: EXPECTED_AVATAR,
                },
                sessionUser: USER,
            });

            console.log(`OLD: ${ACCOUNT.name}`);
            console.log(`NEW: ${EXPECTED_NAME}`);

            await AccountApi.update(req, res);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: ACCOUNT.id,
                    name: EXPECTED_NAME,
                    avatar: EXPECTED_AVATAR,
                })
            );

            expect(await Account.findOne({
                where: {
                    id: ACCOUNT.id,
                    name: EXPECTED_NAME,
                    avatar: EXPECTED_AVATAR,
                }
            })).not.toBeNull();
        });
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    it("does not update a non-existing account (when an admin)", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const USER: User = await ctx.createUserInDatabase();
            const NON_EXISTING_ACCOUNT_ID: string = uuidv4();
            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    accountId: NON_EXISTING_ACCOUNT_ID,
                },
                body: {
                    name: uuidv4(),
                },
                sessionUser: USER,
            });

            expect(AccountApi.update(req, res)).rejects.toThrow(new ObjectNotFoundError("Account", NON_EXISTING_ACCOUNT_ID));
        });
    });
});
