import { faker } from "@faker-js/faker"; // https://fakerjs.dev/api/
import { DatabaseHelper } from "../config";
import { Account, AccountStatus } from "./Account";
import { User, UserStatus } from "./User";

describe("src/models/User", () => {

    beforeAll(async () => {
        await DatabaseHelper.connect();
    });

    afterAll(async () => {
        await DatabaseHelper.close();
    });

    it("should create and delete a user", async () => {
        const testAccount = new Account();
        testAccount.name = faker.company.name();
        testAccount.avatar = faker.company.name();
        testAccount.status = AccountStatus.active;
        await testAccount.save();

        const testUser = new User();
        testUser.name = faker.person.fullName();
        testUser.email = faker.internet.email();
        testUser.avatar = faker.company.name();
        testUser.status = UserStatus.active;
        await testUser.save();

        // Load the user back, and check all fields
        let user = await User.findOne({ where: { id: testUser.id } });
        expect(user).not.toBeNull();
        expect(user!.email).toEqual(testUser.email);
        expect(user!.name).toEqual(testUser.name);
        expect(user!.avatar).toEqual(testUser.avatar);
        expect(user!.status).toEqual(testUser.status);


        const accountId = testAccount.id;
        const userId = testUser.id;

        await testAccount.remove();
        await testUser.remove();

        // Check it really was deleted
        const account = await Account.findOne({ where: { id: accountId } });
        user = await User.findOne({ where: { id: userId } });

        expect(account).toBeNull();
        expect(user).toBeNull();

        return;
    });
});
