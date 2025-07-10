import { AuthError } from "./AuthError";

describe("src/errors/AuthError", () => {

    test("AuthError()", () => {
        const msg = "This is a custom user error";

        try {
            throw new AuthError(msg);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            expect(err.toString()).toEqual("Error: " + msg);
        }
    });

    test("AuthError().code", () => {
        const msg = "This is a custom user error";

        try {
            throw new AuthError(msg);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            expect(err.code).toEqual(401);
        }
    });

});
