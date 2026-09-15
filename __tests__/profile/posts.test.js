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
            { expiresIn: "1d", issuer: "cat-app", audience: "cat-app-users" }
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

    it("should paginate profile posts", async () => {
        await generateTestPost(testUser.id);
        await generateTestPost(testUser.id);

        const firstPage = await request(app)
            .get(`/api/v1/profile/${testUser.username}/posts`)
            .query({ limit: 1, offset: 0 })
            .set("Cookie", [`token=${authToken}`]);

        const secondPage = await request(app)
            .get(`/api/v1/profile/${testUser.username}/posts`)
            .query({ limit: 1, offset: 1 })
            .set("Cookie", [`token=${authToken}`]);

        expect(firstPage.status).toBe(200);
        expect(secondPage.status).toBe(200);
        expect(firstPage.body.data).toHaveLength(1);
        expect(secondPage.body.data).toHaveLength(1);
        expect(firstPage.body.data[0].id).not.toBe(secondPage.body.data[0].id);
        expect(firstPage.body.meta).toEqual({ total: 2, limit: 1, offset: 0 });
        expect(secondPage.body.meta).toEqual({ total: 2, limit: 1, offset: 1 });
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
