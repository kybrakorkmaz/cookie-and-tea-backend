import app from "../../src/servers/app.js";
import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {db, sql} from "../../src/db/client.js";
import {follows} from "../../src/db/schema/index.js";
import {purgeTestUsers, seedCompleteProfileContext, seedTestUser} from "../utils/testDb.util.js";
import {createAuthenticatedAgent} from "../utils/auth.util.js";

describe("Profile people lists", () => {
    const uniqueId = Math.floor(Math.random() * 10000);
    const rawPassword = "password123";

    let testUser;
    let testFollower;
    let authedAgent;

    beforeAll(async () => {
        await purgeTestUsers();
        const seed = await seedCompleteProfileContext(uniqueId, rawPassword);
        testUser = seed.user;
        testFollower = seed.follower;
        authedAgent = await createAuthenticatedAgent(app, testUser.username, rawPassword);
    });

    afterAll(async () => {
        try {
            await purgeTestUsers();
        } finally {
            if (sql && typeof sql.end === "function") {
                await sql.end();
            }
        }
    });

    it("should list followers with isFollowing relative to the viewer", async () => {
        const response = await authedAgent.get(`/api/v1/profile/${testUser.username}/followers`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].username).toBe(testFollower.username);
        expect(response.body.data[0].isFollowing).toBe(false);
        expect(response.body.meta.total).toBe(1);
    });

    it("should return an empty following list with 200", async () => {
        const response = await authedAgent.get(`/api/v1/profile/${testUser.username}/following`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual([]);
        expect(response.body.meta.total).toBe(0);
    });

    it("should paginate followers with a hard cap", async () => {
        const extra = await seedTestUser({}, "active");
        await db.insert(follows).values({
            followerId: extra.id,
            followingId: testUser.id
        });

        const response = await authedAgent
            .get(`/api/v1/profile/${testUser.username}/followers`)
            .query({ limit: 1, offset: 0 });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.meta).toEqual({ total: 2, limit: 1, offset: 0 });
    });

    it("should reject following yourself", async () => {
        const response = await authedAgent.post(`/api/v1/profile/${testUser.username}/follow`);

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/cannot follow yourself/i);
    });

    it("should follow another user and mark isFollowing on the list", async () => {
        const response = await authedAgent.post(`/api/v1/profile/${testFollower.username}/follow`);
        expect(response.status).toBe(201);

        const following = await authedAgent.get(`/api/v1/profile/${testUser.username}/following`);
        expect(following.status).toBe(200);
        expect(following.body.data).toHaveLength(1);
        expect(following.body.data[0].username).toBe(testFollower.username);
        expect(following.body.data[0].isFollowing).toBe(true);
    });
});
