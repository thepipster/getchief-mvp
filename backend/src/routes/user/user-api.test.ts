import { getMockReq, getMockRes } from "@jest-mock/express"; // https://www.npmjs.com/package/@jest-mock/express
import { v4 as uuidv4 } from "uuid";
import { DatabaseHelper } from "../../config";
import { User } from "../../models/User";
import { TestContext, withTestContext } from "../../utils/TestUtils.test";
import { OverdriveRequest } from "../OverdriveRequest";
import UserAPI from "./user-api";
import { ObjectNotFoundError } from "../../errors/ObjectNotFoundError";

describe("/src/routes/user/user-api", () => {
    beforeAll(async () => {
        await DatabaseHelper.connect();
    });

    afterAll(async () => {
        await DatabaseHelper.close();
    });

    test("Load a user with null params", async () => {
        const { res, next } = getMockRes({});
        const req = getMockReq<OverdriveRequest>({
            params: null,
        });

        expect(UserAPI.loadUser(req, res, next)).rejects.toThrow(Error);
    });

    test("Load a user with params lacking userId", async () => {
        const { res, next } = getMockRes({});
        const req = getMockReq<OverdriveRequest>({
            params: {},
        });

        expect(UserAPI.loadUser(req, res, next)).rejects.toThrow(Error);
    });

    test("Load a user with non-existing userId", async () => {
        const NONEXISTING_ID: string = uuidv4();
        const { res, next } = getMockRes({});
        const req = getMockReq<OverdriveRequest>({
            params: {
                userId: NONEXISTING_ID,
            },
        });

        expect(UserAPI.loadUser(req, res, next)).rejects.toThrow(new ObjectNotFoundError("User", NONEXISTING_ID));
    });

    test("gets my user", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const USER: User = await ctx.createUserInDatabase();
            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                sessionUser: USER,
            });

            await UserAPI.getMe(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: USER.name,
                    email: USER.email,
                    avatar: USER.avatar,
                })
            );
        });
    });

    test("get all users for an account (must be admin)", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const USER: User = await ctx.createUserInDatabase(await ctx.createAccountInDatabase());

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    userId: USER.id,
                },
                sessionUser: USER,
            });

            await UserAPI.getAccountUsers(req, res);

            // Expect 4 users to be returned but without the account
            expect(res.json).toHaveBeenCalledWith(
                {
                    users: [
                        expect.objectContaining({
                            id: USER.id,
                            accountId: USER.account.id,
                            avatar: USER.avatar,
                            email: USER.email,
                            name: USER.name,
                        })
                    ],
                }
            );
        });
    });

    test("get a user (must be admin)", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const USER: User = await ctx.createUserInDatabase();
            const OTHER_USER: User = await ctx.createUserInDatabase();

            const mockNext = jest.fn();
            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    userId: OTHER_USER.id,
                },
                sessionUser: USER,
            });

            await UserAPI.loadUser(req, res, mockNext);
            expect(req.user).not.toBeNull();
            expect(req.user!.email).toBe(OTHER_USER.email);
            expect(req.user!.id).toBe(OTHER_USER.id);
            expect(mockNext.mock.calls).toHaveLength(1);

            await UserAPI.get(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: OTHER_USER.email,
                })
            );
        });
    });

    test("deletes a user (must be admin)", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const USER: User = await ctx.createUserInDatabase();
            const OTHER_USER: User = await ctx.createUserInDatabase();

            const mockNext = jest.fn();
            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    userId: OTHER_USER.id,
                },
                sessionUser: USER,
            });

            await UserAPI.loadUser(req, res, mockNext);
            expect(req.user).not.toBeNull();
            expect(req.user!.email).toBe(OTHER_USER.email);
            expect(req.user!.id).toBe(OTHER_USER.id);
            expect(mockNext.mock.calls).toHaveLength(1);

            await UserAPI.delete(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: "deleted",
                })
            );
        });
    });

    test("updates a user (must be admin)", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const USER: User = await ctx.createUserInDatabase();
            const OTHER_USER: User = await ctx.createUserInDatabase();

            const mockNext = jest.fn();

            OTHER_USER.name = uuidv4();
            OTHER_USER.avatar = uuidv4();

            const { res } = getMockRes({});
            const req = getMockReq<OverdriveRequest>({
                params: {
                    userId: OTHER_USER.id,
                },
                body: OTHER_USER,
                sessionUser: USER,
            });

            await UserAPI.loadUser(req, res, mockNext);
            expect(mockNext.mock.calls).toHaveLength(1);

            await UserAPI.update(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: OTHER_USER.name,
                    avatar: OTHER_USER.avatar,
                })
            );
        });
    });
});
