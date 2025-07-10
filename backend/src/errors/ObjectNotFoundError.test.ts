import { v4 as uuidv4 } from "uuid";
import { ObjectNotFoundError } from "./ObjectNotFoundError";

describe("src/errors/ObjectNotFoundError", () => {
    it("stores the object ctor arguments", () => {
        const EXPECTED_TYPE: string = uuidv4();
        const EXPECTED_ID: string = uuidv4();

        const TARGET: ObjectNotFoundError = new ObjectNotFoundError(EXPECTED_TYPE, EXPECTED_ID);
        expect(TARGET).toEqual(
            expect.objectContaining(
                {
                    object_type: EXPECTED_TYPE,
                    object_id: EXPECTED_ID,
                }
            )
        );
    });

    it("does not allow null as object type", () => {
        expect(() => { new ObjectNotFoundError(null, uuidv4()); }).toThrow(Error);
    });

    it("uses null as the value for the object id when unspecified", () => {
        const EXPECTED_TYPE: string = uuidv4();

        const TARGET: ObjectNotFoundError = new ObjectNotFoundError(EXPECTED_TYPE, null);
        expect(TARGET).toEqual(
            expect.objectContaining(
                {
                    object_type: EXPECTED_TYPE,
                    object_id: null,
                }
            )
        );
    });

    it("has status code 404", () => {
        const TARGET: ObjectNotFoundError = new ObjectNotFoundError(uuidv4(), uuidv4());
        expect(TARGET.code).toEqual(404);
    });

    it("fully renders", () => {
        const TYPE: string = uuidv4();
        const ID: string = uuidv4();
        const TARGET: ObjectNotFoundError = new ObjectNotFoundError(TYPE, ID);

        const ACTUAL = TARGET.toString();
        expect(ACTUAL).toContain(TYPE);
        expect(ACTUAL).toContain(" with id ");
        expect(ACTUAL).toContain(ID);
    });

    it("renders correctly without Id", () => {
        const TYPE: string = uuidv4();
        const TARGET: ObjectNotFoundError = new ObjectNotFoundError(TYPE, null);

        const ACTUAL = TARGET.toString();
        expect(ACTUAL).toContain(TYPE);
        expect(ACTUAL).not.toContain(" with id ");
    });
});
