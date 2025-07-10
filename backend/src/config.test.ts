import { config, Config, DatabaseHelper } from "./config";

describe("src/config", () => {
    test("should connect to database, and close it again", async () => {
        // Make sure the DB connection is closed first
        if (DatabaseHelper.ds) {
            await DatabaseHelper.close();
        }

        expect(DatabaseHelper.isConnected).toEqual(false);

        // Now connect
        await DatabaseHelper.connect();
        expect(DatabaseHelper.ds.isInitialized).toEqual(true);
        expect(DatabaseHelper.isConnected).toEqual(true);

        // Now close again
        await DatabaseHelper.close();
        expect(DatabaseHelper.isConnected).toEqual(false);
    });

    test("CANARY: ensure vault configuration is populated", () => {
        // NOTE: this is a canary test, if this test fails, then a bunch of other tests will fail as well
        const TARGET: Config = config;

        expect(TARGET.vault).toBeDefined();

        // if you haven't defined these, your tests will fail
        expect(TARGET.vault.token).toBeTruthy();
        expect(TARGET.vault.uri).toBeTruthy();
    });
});
