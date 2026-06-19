import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { db, sql } from "../src/db/client.js";
import { posts} from "../src/db/schema/index.js";
import app from "../src/servers/app.js";
import request from "supertest";
import { purgeTestUsers, seedTestUser } from "./utils/testDb.util.js";
import jwt from "jsonwebtoken";
import { ENV } from "../env.js";

describe("Posts Integration Suite", () => {
    let testUser;
    let authToken;

    beforeAll(async () => {
        await purgeTestUsers();
        testUser = await seedTestUser({}, "active");
        authToken = jwt.sign(
            { userId: testUser.id, username: testUser.username },
            ENV.JWT_SECRET,
            { expiresIn: "1d" }
        );
    });

    afterAll(async () => {
        try {
            await db.delete(posts).execute();
            await purgeTestUsers();
        } finally {
            if (sql && typeof sql.end === "function") {
                await sql.end();
            }
        }
    });

    describe("POST /api/posts", () => {
        it("should create a new text post", async () => {
            const payload = {
                post_header: "Test Header",
                post_type: "text",
                post_detail: "Test Detail"
            };

            const response = await request(app)
                .post("/api/posts")
                .set("Cookie", [`token=${authToken}`])
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data).toHaveProperty("post_id");
            expect(response.body.data.post_header).toBe(payload.post_header);
            expect(response.body.data.post_detail).toBe(payload.post_detail);
            expect(response.body.data.post_type).toBe(payload.post_type);
        });

        it("should create a new image post with media", async () => {
            const payload = {
                post_header: "Image Post",
                post_type: "image",
                post_detail: "Behold my image",
                post_image: ["http://example.com/image.png"]
            };

            const response = await request(app)
                .post("/api/posts")
                .set("Cookie", [`token=${authToken}`])
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.data.post_image).toContain(payload.post_image[0]);
        });

        it("should fail to create image post without media", async () => {
            const payload = {
                post_header: "Image Post",
                post_type: "image",
                post_detail: "No image here"
            };

            const response = await request(app)
                .post("/api/posts")
                .set("Cookie", [`token=${authToken}`])
                .send(payload);

            expect(response.status).toBe(400);
        });
    });

    describe("GET /api/posts/:id", () => {
        it("should retrieve a post by id", async () => {
            // First create a post
            const createResponse = await request(app)
                .post("/api/posts")
                .set("Cookie", [`token=${authToken}`])
                .send({
                    post_header: "Fetch Me",
                    post_type: "text",
                    post_detail: "Detail"
                });
            
            const postId = createResponse.body.data.post_id;

            const response = await request(app).get(`/api/posts/${postId}`);
            
            expect(response.status).toBe(200);
            expect(response.body.data.post_id).toBe(postId);
            expect(response.body.data.post_header).toBe("Fetch Me");
        });
    });

    describe("PUT /api/posts/:id", () => {
        it("should update an existing post", async () => {
             const createResponse = await request(app)
                .post("/api/posts")
                .set("Cookie", [`token=${authToken}`])
                .send({
                    post_header: "Old Header",
                    post_type: "text",
                    post_detail: "Old Detail"
                });
            
            const postId = createResponse.body.data.post_id;

            const updatePayload = {
                post_header: "New Header",
                post_type: "text",
                post_detail: "New Detail"
            };

            const response = await request(app)
                .put(`/api/posts/${postId}`)
                .set("Cookie", [`token=${authToken}`])
                .send(updatePayload);

            expect(response.status).toBe(200);
            expect(response.body.data.post_header).toBe("New Header");
            expect(response.body.data.post_detail).toBe("New Detail");
        });
    });

    describe("DELETE /api/posts/:id", () => {
        it("should delete an existing post", async () => {
            const createResponse = await request(app)
                .post("/api/posts")
                .set("Cookie", [`token=${authToken}`])
                .send({
                    post_header: "Delete Me",
                    post_type: "text",
                    post_detail: "Detail"
                });
            
            const postId = createResponse.body.data.post_id;

            const response = await request(app)
                .delete(`/api/posts/${postId}`)
                .set("Cookie", [`token=${authToken}`])
                .send();

            expect(response.status).toBe(204);

            const getResponse = await request(app).get(`/api/posts/${postId}`);
            expect(getResponse.status).toBe(404);
        });
    });
});
