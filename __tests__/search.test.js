import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import app from "../src/servers/app.js";
import request from "supertest";
import {db, sql} from "../src/db/client.js";
import {purgeTestUsers, seedTestUser} from "./utils/testDb.util.js";

describe("User Search Integration Suite (GET /api/v1/search/users)", () => {

    // ------------- ARRANGE ---------------------
    beforeAll(async () => {
        // Clean out stale data before execution
        await purgeTestUsers();
    });

    afterAll(async () => {
        try {
            // Sweep clean all modifications made during the test run
            await purgeTestUsers();
        } finally {
            if (sql && typeof sql.end === "function") {
                await sql.end();
            }
        }
    });

    // ------------- ACT & ASSERT ---------------------
    it("should find active users by username substring and expose only safe public fields", async () => {
        const uniqueId = Math.floor(Math.random() * 100000);
        const seeded = await seedTestUser({
            username: `test_alice_${uniqueId}`,
            name: "Alice Search"
        }, "active");

        const response = await request(app).get(`/api/v1/search/users?q=alice_${uniqueId}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.results).toBe(1);

        const hit = response.body.users.find(u => u.id === seeded.id);
        expect(hit).toBeDefined();
        expect(hit.username).toBe(seeded.username);
        expect(hit.name).toBe("Alice Search");

        // Public contract: sensitive fields must never leak through search
        expect(hit).not.toHaveProperty("email");
        expect(hit).not.toHaveProperty("hashedPassword");
        expect(hit).not.toHaveProperty("status");
    });

    it("should find users by display name (case-insensitive)", async () => {
        const uniqueId = Math.floor(Math.random() * 100000);
        const seeded = await seedTestUser({
            username: `test_zephyr_${uniqueId}`,
            name: `Zephyr Unique${uniqueId}`
        }, "active");

        // Query in lowercase against a mixed-case name to prove ILIKE behavior
        const response = await request(app)
            .get("/api/v1/search/users")
            .query({q: `zephyr unique${uniqueId}`});

        expect(response.status).toBe(200);
        const hit = response.body.users.find(u => u.id === seeded.id);
        expect(hit).toBeDefined();
    });

    it("should exclude pending (unverified) users from results", async () => {
        const uniqueId = Math.floor(Math.random() * 100000);
        await seedTestUser({
            username: `test_pending_${uniqueId}`,
            name: `Pending Person ${uniqueId}`
        }, "pending");

        const response = await request(app).get(`/api/v1/search/users?q=pending_${uniqueId}`);

        expect(response.status).toBe(200);
        expect(response.body.results).toBe(0);
        expect(response.body.users).toEqual([]);
    });

    it("should respect the limit query parameter", async () => {
        const uniqueId = Math.floor(Math.random() * 100000);
        // Seed three users whose names all contain the same searchable token
        for (let i = 0; i < 3; i++) {
            await seedTestUser({
                username: `test_limit_${uniqueId}_${i}`,
                name: `LimitToken${uniqueId} Person ${i}`
            }, "active");
        }

        const response = await request(app).get(`/api/v1/search/users?q=limittoken${uniqueId}&limit=2`);

        expect(response.status).toBe(200);
        expect(response.body.results).toBe(2);
        expect(response.body.users.length).toBe(2);
    });

    it("should treat LIKE wildcards as literal characters", async () => {
        await seedTestUser({}, "active");

        // "%" must be escaped — otherwise it would match every active user in the DB
        const response = await request(app).get("/api/v1/search/users").query({q: "%"});

        expect(response.status).toBe(200);
        expect(response.body.results).toBe(0);
        expect(response.body.users).toEqual([]);
    });

    it("should return 400 when the q parameter is missing", async () => {
        const response = await request(app).get("/api/v1/search/users");

        expect(response.status).toBe(400);
        expect(response.body.message).toBeDefined();
    });

    it("should return 400 when the q parameter is empty", async () => {
        const response = await request(app).get("/api/v1/search/users").query({q: ""});

        expect(response.status).toBe(400);
        expect(response.body.message).toBeDefined();
    });
});
