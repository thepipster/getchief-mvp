import { faker } from "@faker-js/faker"; // https://fakerjs.dev/api/
import { getMockReq, getMockRes } from "@jest-mock/express"; // https://www.npmjs.com/package/@jest-mock/express
import { DecodedIdToken } from "firebase-admin/auth";
import { DatabaseHelper } from "../../config";
import { AuthError } from "../../errors/AuthError";
import { Account, AccountStatus } from "../../models/Account";
import { User, UserRole, UserStatus } from "../../models/User";
import { FirebaseHelper } from "../../services/FirebaseHelper";
import { Logger } from "../../utils/Logger";
import { OverdriveRequest } from "../OverdriveRequest";
import AuthAPI from "./auth-api";

const testEmail = faker.internet.email();
const testAvatar = faker.image.avatar();
const testToken = "xxxxxxx";

const mockVerifyIdToken = async function (
    _token: string
): Promise<DecodedIdToken> {
    Logger.debug("MOCKING VERIFY ID TOKEN");
    const tmp: DecodedIdToken = {
        aud: "aud",
        auth_time: 1,
        email_verified: true,
        email: testEmail,
        exp: 0,
        firebase: null,
        iat: 0,
        iss: "",
        phone_number: "",
        picture: testAvatar,
        sub: "",
        uid: "",
    };
    return tmp;
};

describe("/src/routes/user/auth-api", () => {
    let __verifyIdToken: (token: string) => Promise<DecodedIdToken>;
    let testAccount: Account;
    let testAccount2: Account;
    let testUser: User;

    // ///////////////////////////////////////////////////////////////////////////////////////

    beforeAll(async () => {
        await DatabaseHelper.connect();

        // Create test users and account
        testAccount = new Account();
        testAccount.name = faker.company.name();
        testAccount.avatar = faker.image.avatar();
        testAccount.status = AccountStatus.active;
        await testAccount.save();

        testAccount2 = new Account();
        testAccount2.name = faker.company.name();
        testAccount2.avatar = faker.image.avatar();
        testAccount2.status = AccountStatus.active;
        await testAccount2.save();

        testUser = new User();
        testUser.name = faker.person.fullName();
        testUser.email = testEmail;
        testUser.avatar = testAvatar;
        testUser.status = UserStatus.active;
        testUser.account = testAccount;
        testUser.role = UserRole.user;
        await testUser.save();

        __verifyIdToken = FirebaseHelper.verifyIdToken;
        FirebaseHelper.verifyIdToken = mockVerifyIdToken;

        return;
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    afterAll(async () => {
        FirebaseHelper.verifyIdToken = __verifyIdToken;
        await testUser!.remove();
        await testAccount!.remove();
        await testAccount2!.remove();
        await DatabaseHelper.close();
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    it("checks a token", async () => {
        const mockNext = jest.fn();
        const testIp = "127.0.0.1";
        const { res } = getMockRes({});
        const req = getMockReq<OverdriveRequest>({
            headers: {
                authorization: `Bearer ${testToken}`,
                "x-client-ip": testIp,
            },
        });

        await AuthAPI.isUser(req, res, mockNext);

        //expect(mockKoaContext.throw.mock.calls).toHaveLength(1);

        expect(res.status).not.toBe(401);
        expect(req.sessionUser).not.toBeNull();
        expect(req.sessionUser!.email).toBe(testEmail);
        expect(req.sessionUser!.avatar).toBe(testAvatar);

        // next should have been called
        expect(mockNext.mock.calls).toHaveLength(1);
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    it("block user from admin routes", async () => {
        const mockNext = jest.fn();
        const testIp = "127.0.0.1";
        const { res } = getMockRes({});
        const req = getMockReq<OverdriveRequest>({
            headers: {
                authorization: `Bearer ${testToken}`,
                "x-client-ip": testIp,
            },
        });

        // Set user role to user
        testUser.role = UserRole.user;
        await testUser.save();

        expect(AuthAPI.isAdmin(req, res, mockNext)).rejects.toThrow(AuthError);

        // next should NOT have been called
        expect(mockNext.mock.calls).toHaveLength(0);
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    it("allows admin users for admin only routes", async () => {
        const mockNext = jest.fn();
        const mockThrow = jest.fn();
        const testIp = "127.0.0.1";
        const { res } = getMockRes({});
        const req = getMockReq<OverdriveRequest>({
            headers: {
                authorization: `Bearer ${testToken}`,
                "x-client-ip": testIp,
            },
        });

        // Make the user an admin
        testUser.role = UserRole.admin;
        await testUser.save();

        await AuthAPI.isAdmin(req, res, mockNext);

        // throw should NOT have been called
        expect(mockThrow.mock.calls).toHaveLength(0);

        // next should have been called
        expect(mockNext.mock.calls).toHaveLength(1);
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    it("block user and admin from uber-admin routes", async () => {
        const mockNext = jest.fn();
        const testIp = "127.0.2.1";
        const { res } = getMockRes({});
        const req = getMockReq<OverdriveRequest>({
            headers: {
                authorization: `Bearer ${testToken}`,
                "x-client-ip": testIp,
            },
        });

        // Set user role to user
        testUser.role = UserRole.user;
        await testUser.save();

        expect(AuthAPI.isUber(req, res, mockNext)).rejects.toThrow(AuthError);

        // next should NOT have been called
        expect(mockNext.mock.calls).toHaveLength(0);

        // Set user role to admin
        testUser.role = UserRole.admin;
        await testUser.save();

        expect(AuthAPI.isUber(req, res, mockNext)).rejects.toThrow(AuthError);

        // next should NOT have been called
        expect(mockNext.mock.calls).toHaveLength(0);
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    it("allows uber-admin users for uber-admin only routes", async () => {
        const mockNext = jest.fn();
        const mockThrow = jest.fn();
        const testIp = "127.0.0.1";
        const { res } = getMockRes({});
        const req = getMockReq<OverdriveRequest>({
            headers: {
                authorization: `Bearer ${testToken}`,
                "x-client-ip": testIp,
            },
        });

        // Make the user an admin
        testUser.role = UserRole.uberAdmin;
        await testUser.save();

        await AuthAPI.isUber(req, res, mockNext);

        // throw should NOT have been called
        expect(mockThrow.mock.calls).toHaveLength(0);

        // next should have been called
        expect(mockNext.mock.calls).toHaveLength(1);
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    it("allows uber-admin users to view any account (using X-Account-Id)", async () => {
        const mockNext = jest.fn();
        const mockThrow = jest.fn();

        const testIp = "127.0.0.1";
        const { res } = getMockRes({});
        const req = getMockReq<OverdriveRequest>({
            headers: {
                authorization: `Bearer ${testToken}`,
                "x-client-ip": testIp,
                "x-account-id": testAccount2.id,
            },
        });

        // Make the user an admin
        testUser.role = UserRole.uberAdmin;
        await testUser.save();

        await AuthAPI.isAdmin(req, res, mockNext);

        // throw should NOT have been called
        expect(mockThrow.mock.calls).toHaveLength(0);

        // next should have been called
        expect(mockNext.mock.calls).toHaveLength(1);

        // Account id should have been set properly
        expect(req.sessionUser).not.toBeNull();
        expect(req.sessionUser!.account.id).toBe(testAccount2.id);
    });

    // ///////////////////////////////////////////////////////////////////////////////////////

    it("stops non uber-admin users viewing other accounts", async () => {
        const mockNext = jest.fn();
        const mockThrow = jest.fn();
        const testIp = "127.0.0.1";
        const { res } = getMockRes({});
        const req = getMockReq<OverdriveRequest>({
            headers: {
                authorization: `Bearer ${testToken}`,
                "x-client-ip": testIp,
            },
        });

        // Make the user an admin
        testUser.role = UserRole.admin;
        await testUser.save();

        await AuthAPI.isAdmin(req, res, mockNext);

        // throw should NOT have been called
        expect(mockThrow.mock.calls).toHaveLength(0);

        // next should have been called
        expect(mockNext.mock.calls).toHaveLength(1);

        // Account id should have been set properly
        expect(req.sessionUser).not.toBeNull();
        expect(req.sessionUser!.account.id).toBe(testAccount.id);
    });
});
