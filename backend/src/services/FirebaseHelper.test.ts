import { fail } from "assert";
import { v4 as uuidv4 } from "uuid";
import { TestContext, withTestContext } from "../utils/TestUtils.test";
import { FirebaseHelper } from "./FirebaseHelper";

function get_random_int(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generate_test_email_address(): string {
    return `${uuidv4()}@${uuidv4()}.test.local`;
}

describe("src/services/FirebaseHelper", () => {
    beforeAll(async () => { });

    afterAll(async () => { });

    // Uncomment this line if you want to skip running the Firebase Tests (which are somewhat slow)
    // NOTE: This does mean you'll always get a single failure (which will act as your canary that you have this enabled)
    // test.only("SKIP EVERYTHING", () => { expect(true).toEqual(false); });

    test("get non-existing user by id", async () => {
        expect(await FirebaseHelper.getUserByUid(uuidv4())).toBeNull();
    });

    test("get non-existing user by email", async () => {
        expect(
            await FirebaseHelper.getUserByEmail(generate_test_email_address())
        ).toBeNull();
    });

    test("Create a new user", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const EXPECTED_EMAIL = generate_test_email_address();
            const EXPECTED_NAME = uuidv4();

            const CREATED = await FirebaseHelper.createUser(EXPECTED_EMAIL, EXPECTED_NAME);
            ctx.registerFirebaseUser(CREATED);
            expect(CREATED).not.toBeNull();

            const ACTUAL = await FirebaseHelper.getUserByUid(CREATED.uid);
            expect(ACTUAL).not.toBe(null);
            expect(ACTUAL).toEqual(CREATED);
        });
    });

    test("get user by e-mail", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const EXPECTED = await ctx.createFirebaseUser();

            const ACTUAL = await FirebaseHelper.getUserByEmail(EXPECTED.email);
            expect(ACTUAL).not.toBeNull();
            expect(ACTUAL!.email).toEqual(EXPECTED.email);
            expect(ACTUAL!.uid).toEqual(EXPECTED.uid);
        });
    });

    test("get user by id", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const EXPECTED = await ctx.createFirebaseUser();

            const ACTUAL = await FirebaseHelper.getUserByUid(EXPECTED.uid);
            expect(ACTUAL).not.toBeNull();
            expect(ACTUAL!.email).toEqual(EXPECTED.email);
            expect(ACTUAL!.uid).toEqual(EXPECTED.uid);
        });
    });

    test("Update a user", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const expected = await ctx.createFirebaseUser();

            expected.displayName = uuidv4();
            expected.photoURL = `https://${uuidv4()}`;

            const UPDATED = await FirebaseHelper.updateUser(expected.uid, expected);
            expect(UPDATED.displayName).toEqual(expected.displayName);
            expect(UPDATED.photoURL).toEqual(expected.photoURL);

            // Check it stuck
            const ACTUAL = await FirebaseHelper.getUserByUid(expected.uid);
            expect(ACTUAL).not.toBeNull();
            expect(ACTUAL!.displayName).toEqual(expected.displayName);
            expect(ACTUAL!.photoURL).toEqual(expected.photoURL);
        });
    });

    test("Update a user fully", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const expected = await ctx.createFirebaseUser();

            expected.email = generate_test_email_address();
            expected.displayName = uuidv4();
            expected.photoURL = `https://${uuidv4()}`;
            expected.disabled = true;

            const UPDATED = await FirebaseHelper.updateUser(expected.uid, expected);
            expect(UPDATED.email).toEqual(expected.email);
            expect(UPDATED.displayName).toEqual(expected.displayName);
            expect(UPDATED.photoURL).toEqual(expected.photoURL);
            expect(UPDATED.disabled).toEqual(expected.disabled);

            // Check it stuck
            const ACTUAL = await FirebaseHelper.getUserByUid(expected.uid);
            expect(ACTUAL).not.toBeNull();
            expect(ACTUAL!.email).toEqual(expected.email);
            expect(ACTUAL!.displayName).toEqual(expected.displayName);
            expect(ACTUAL!.photoURL).toEqual(expected.photoURL);
            expect(ACTUAL!.disabled).toEqual(expected.disabled);
        });
    }, 7000);

    test("Update user e-mail only", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const ORIGINAL = await ctx.createFirebaseUser();

            const ORIGINAL_EMAIL: string = ORIGINAL.email;
            const MODIFIED_EMAIL: string = generate_test_email_address();

            const result = await FirebaseHelper.updateUserEmail(
                ORIGINAL.uid,
                MODIFIED_EMAIL
            );
            expect(result).not.toBeNull();

            const ACTUAL = await FirebaseHelper.getUserByEmail(MODIFIED_EMAIL);
            expect(ACTUAL).not.toBeNull();
            expect(ACTUAL).not.toBeNull();
            expect(ACTUAL!.email).not.toBe(ORIGINAL_EMAIL);
            expect(ACTUAL!.email).toBe(MODIFIED_EMAIL);
        });
    });

    test("delete non-existing user by uid", async () => {
        const UID = uuidv4();
        try {
            await FirebaseHelper.deleteUser(UID);
        } catch (_) {
            fail("This code should never be reached");
        }
    });

    test("delete existing user by id", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET = await ctx.createFirebaseUser();

            await FirebaseHelper.deleteUser(TARGET.uid);

            expect(await FirebaseHelper.getUserByUid(TARGET.uid)).toBeNull();
            expect(await FirebaseHelper.getUserByEmail(TARGET.email)).toBeNull();
        });
    });

    test("delete existing user by email", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const TARGET = await ctx.createFirebaseUser();

            await FirebaseHelper.deleteUserByEmail(TARGET.email);

            expect(await FirebaseHelper.getUserByUid(TARGET.uid)).toBeNull();
            expect(await FirebaseHelper.getUserByEmail(TARGET.email)).toBeNull();
        });
    });

    test("Get all users", async () => {
        const CTX: TestContext = new TestContext();
        await withTestContext(CTX, async (ctx) => {
            const ADDITIONAL_COUNT: number = get_random_int(2, 5);
            const created: Set<string> = new Set();
            for (let i = 0; i < ADDITIONAL_COUNT; i++) {
                created.add((await ctx.createFirebaseUser()).uid);
            }

            const POST_ADDITION_USERS = await FirebaseHelper.getAllUsers();

            // make sure the new users are represented in the new set of 'all users'
            const ACTUAL_UIDS: Set<string> = new Set(
                POST_ADDITION_USERS.map((u) => u.uid)
            );
            created.forEach((expected_uid) => {
                expect(ACTUAL_UIDS.has(expected_uid)).toBe(true);
            });
        });
    }, 10000);

    test("Invalid token returns null", async () => {
        const token = uuidv4();
        await expect(FirebaseHelper.verifyIdToken(token)).rejects.toThrow(
            Error
        );
    });
});
