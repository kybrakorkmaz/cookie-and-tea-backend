import request from "supertest";
import {describe, expect, it} from "@jest/globals";
import app from "../src/servers/app.js";

describe("GET /api/status", () => {
    it("should return a 200 status and a success message", async () =>{
        const response = await request(app)
            .get("/health")
            .expect("Content-Type", /json/)
            .expect(200);

        // Updated properties to mirror your app.js health route response keys
        expect(response.body).toHaveProperty("status", "ok");
        expect(response.body).toHaveProperty("database", "connected");
    });
});