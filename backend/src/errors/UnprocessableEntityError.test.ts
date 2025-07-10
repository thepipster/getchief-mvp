import { v4 as uuidv4 } from "uuid";
import { UnprocessableEntityError } from "./UnprocessableEntityError";

describe("src/errors/UnprocessableEntityError", () => {
    it("toString matches the message", () => {
        const EXPECTED = uuidv4();
        const target: UnprocessableEntityError = new UnprocessableEntityError(EXPECTED);

        expect(target.toString()).toEqual(EXPECTED);
    });

    it("does not allow null as message", () => {
        expect(() => { new UnprocessableEntityError(null); }).toThrow(Error);
    });

    it("does not allow empty as message", () => {
        expect(() => { new UnprocessableEntityError(""); }).toThrow(Error);
    });
});
