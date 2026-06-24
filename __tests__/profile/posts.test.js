import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { db, sql } from "../../src/db/client.js";
import app from "../../src/servers/app.js";
import request from "supertest";
import {deletePost, generateTestPost, purgeTestUsers, seedTestUser} from "../utils/testDb.util.js";
import jwt from "jsonwebtoken";
import { ENV } from "../../env.js";

describe("Profile Posts Integration Suite", () => {
    let testUser;
    let authToken;
    beforeAll(async () => {
        try {
            await purgeTestUsers();
        } catch (cleanupError) {
            console.warn("Pre-test profile database purge warning:", cleanupError.message);
        }
        // todo make function
        testUser = await seedTestUser({}, "active");
        authToken = jwt.sign(
            { userId: testUser.id, username: testUser.username },
            ENV.JWT_SECRET,
            { expiresIn: "1d" }
        );
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

    it("should get no shared user posts", async () =>{
        const response = await request(app)
            .get(`/api/v1/profile/${testUser.username}/posts`)
            .set("Cookie", [`token=${authToken}`]);

        expect(response.status).toBe(200); // no content
        expect(response.body.data).toEqual([]);
    });

    it("should get user posts", async () => {
        // Create a post first to avoid 204
        await generateTestPost(testUser.id);

        const response = await request(app)
            .get(`/api/v1/profile/${testUser.username}/posts`)
            .set("Cookie", [`token=${authToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
    });
    //todo create user post
    it("should update user post", async () =>{
        const initialPost = await generateTestPost(testUser.id);
        const newPayload =  {
            header: "new title",
            type: "text",
            content: "new content"
        }
        const response = await request(app)
            .put(`/api/v1/profile/${testUser.username}/posts/${initialPost.id}`)
            .set("Cookie", [`token=${authToken}`])
            .send(newPayload);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("id");
    });

    it("should delete user post", async () =>{
        const initialPost = await generateTestPost(testUser.id);
        const response = await request(app)
            .delete(`/api/v1/profile/${testUser.username}/posts/${initialPost.id}`)
            .set("Cookie", [`token=${authToken}`]);

        expect(response.status).toBe(204);

        const isDeleted = await deletePost(testUser.id, initialPost.id);

        // Assert that the returned array is completely empty, proving successful deletion
        expect(isDeleted.length).toBe(0);

        const getResponse = await request(app)
            .get(`/api/v1/profile/${testUser.username}/posts/${initialPost.id}`)
            .set("Cookie", [`token=${authToken}`]);
        expect(getResponse.status).toBe(404);
    })
});
