import {afterAll, beforeAll, describe, expect, it, jest} from "@jest/globals";
import { sql } from "../src/db/client.js";
import app from "../src/servers/app.js";
import request from "supertest";
import {generateTestPost, purgeTestUsers, seedTestUser} from "./utils/testDb.util.js";
import jwt from "jsonwebtoken";
import { ENV } from "../env.js";

const mockImageBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
);

describe("Posts Integration Suite", () => {
    let testUser;
    let authToken;
    beforeAll(async () => {
        try {
            await purgeTestUsers();
        } catch (cleanupError) {
            console.warn("Pre-test database purge warning:", cleanupError.message);
        }

        // Proceed with fresh seed context generation
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

    describe("FEED /api/v1/feed/:username", () => {
        it("should get feed timeline posts, No posts", async ()=>{
            const response = await request(app)
                .get(`/api/v1/feed/${testUser.username}`)
                .set("Cookie", [`token=${authToken}`]);

            expect(response.status).toBe(200); // No post found
            expect(response.body.data).toEqual([]);
        });

        it("should get feed timeline posts", async () => {
            await generateTestPost(testUser.id);
            const response = await request(app)
                .get(`/api/v1/feed/${testUser.username}`)
                .set("Cookie", [`token=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data[0]).toHaveProperty("id");
        });
        it("should create a new text post", async () => {
            const payload = {
                header: "Test Header",
                type: "text",
                content: "Test Detail"
            };

            const response = await request(app)
                .post(`/api/v1/feed/${testUser.username}`)
                .set("Cookie", [`token=${authToken}`])
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data).toHaveProperty("id");
            expect(response.body.data.header).toBe(payload.header);
            expect(response.body.data.content).toBe(payload.content);
            expect(response.body.data.type).toBe(payload.type);
        });

        it("should create a new image post with media", async () => {
            const response = await request(app)
                .post(`/api/v1/feed/${testUser.username}`)
                .set("Cookie", [`token=${authToken}`])
                .field("header", "Image Post")
                .field("content", "Behold my image")
                .field("type", "image")
                // Attach a dummy buffer to simulate an image file stream
                .attach("images", mockImageBuffer, "test-image.png");

            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data.images[0]).toContain("fake_file.png");
        });

        it("should fail to create image post without media", async () => {
            const payload = {
                header: "Image Post",
                type: "image",
                content: "No image here"
            };

            const response = await request(app)
                .post(`/api/v1/feed/${testUser.username}`)
                .set("Cookie", [`token=${authToken}`])
                .send(payload);

            expect(response.status).toBe(400);
        });
    });

    describe("PUT /api/v1/feed/:username/posts/:id", () => {
        it("should update an existing post", async () => {
            const initialPost = await generateTestPost(testUser.id);

            const updatePayload = {
                header: "New Header",
                type: "text",
                content: "New Detail"
            };

            const response = await request(app)
                .put(`/api/v1/feed/${testUser.username}/posts/${initialPost.id}`)
                .set("Cookie", [`token=${authToken}`])
                .send(updatePayload);

            expect(response.status).toBe(200);
            expect(response.body.data.header).toBe("New Header");
            expect(response.body.data.content).toBe("New Detail");
        });
    });

    describe("DELETE /api/v1/feed/:username/posts/:id", () => {
        it("should delete an existing post", async () => {
            const initialPost = await generateTestPost(testUser.id);
            const response = await request(app)
                .delete(`/api/v1/feed/${testUser.username}/posts/${initialPost.id}`)
                .set("Cookie", [`token=${authToken}`])
                .send();

            expect(response.status).toBe(204);
            const getResponse = await request(app)
                .get(`/api/v1/feed/${testUser.username}/posts/${initialPost.id}`)
                .set("Cookie", [`token=${authToken}`]);
            expect(getResponse.status).toBe(404);
        });
    });
});
