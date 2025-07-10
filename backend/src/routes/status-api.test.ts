import request from "supertest";
import app from "../server";

//const next = jest.fn(() => {
//    expect(ctx).toMatchSnapshot()
//  })

describe("/src/routes/status", () => {
    test("should get the status", async () => {
        const response = await request(app).get("/status");
        expect(response.status).toBe(200);
        expect(response.type).toEqual("application/json");

        //expect(response.text).toBe('Hello World');
        expect(typeof response.body.started).toBe("string");
        expect(typeof response.body.version).toBe("string");
        expect(typeof response.body.host).toBe("string");
        expect(typeof response.body.ip).toBe("string");
        expect(typeof response.body.uptime).toBe("number");
        expect(typeof response.body.headers).toBe("object");

        // Make sure commit and version are present in the body
        expect(response.body.commit).toBeDefined();
        expect(response.body.version).toBeDefined();
    });
});
