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

        it("should derive type 'image' when a text post gains a retained image", async () => {
            const textPost = await generateTestPost(testUser.id); // type: "text"

            const response = await request(app)
                .put(`/api/v1/feed/${testUser.username}/posts/${textPost.id}`)
                .set("Cookie", [`token=${authToken}`])
                .send({
                    header: textPost.header,
                    content: textPost.content,
                    existingImages: ["https://res.cloudinary.com/mock-cloud/image/upload/kept.png"]
                });

            expect(response.status).toBe(200);
            // Server derives type from final media — the client-sent type is never trusted
            expect(response.body.data.type).toBe("image");
            expect(response.body.data.images).toEqual(["https://res.cloudinary.com/mock-cloud/image/upload/kept.png"]);
        });

        it("should strip blob: preview URLs from retained media", async () => {
            const textPost = await generateTestPost(testUser.id);

            const response = await request(app)
                .put(`/api/v1/feed/${testUser.username}/posts/${textPost.id}`)
                .set("Cookie", [`token=${authToken}`])
                .send({
                    header: textPost.header,
                    content: textPost.content,
                    existingImages: [
                        "https://res.cloudinary.com/mock-cloud/image/upload/real.png",
                        "blob:http://localhost:5173/dead-preview-url"
                    ]
                });

            expect(response.status).toBe(200);
            // blob: URLs are client-side preview artifacts — never persisted
            expect(response.body.data.images).toEqual(["https://res.cloudinary.com/mock-cloud/image/upload/real.png"]);
            expect(response.body.data.type).toBe("image");
        });

        it("should derive type 'text' when all media is removed", async () => {
            const textPost = await generateTestPost(testUser.id);

            // First give the post an image
            await request(app)
                .put(`/api/v1/feed/${testUser.username}/posts/${textPost.id}`)
                .set("Cookie", [`token=${authToken}`])
                .send({ existingImages: ["https://res.cloudinary.com/mock-cloud/image/upload/x.png"] });

            // Then remove all media
            const response = await request(app)
                .put(`/api/v1/feed/${testUser.username}/posts/${textPost.id}`)
                .set("Cookie", [`token=${authToken}`])
                .send({ header: "Only text now", content: "no media", existingImages: [] });

            expect(response.status).toBe(200);
            expect(response.body.data.type).toBe("text");
            expect(response.body.data.images).toEqual([]);
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

    describe("GET /api/v1/feed/:username/preview", () =>{
        it("should get all preview comments on feed page", async () => {

        })
    });

    describe("GET /api/v1/feed/:username/comments", () =>{

    })
});
