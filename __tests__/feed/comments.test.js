import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {generateTestComment, generateTestPost, getPost, purgeTestUsers, seedTestUser} from "../utils/testDb.util.js";
import jwt from "jsonwebtoken";
import { ENV } from "../../env.js";
import { sql } from "../../src/db/client.js";
import request from "supertest";
import app from "../../src/servers/app.js";

// Covers the per-post comments endpoint mounted under the feed router:
// GET /api/v1/feed/:username/posts/:postId/comment
describe("Feed Post Comments Pagination", () =>{
    let testUser;
    let authToken;

    beforeAll(async () =>{
        try{
            await purgeTestUsers();
        }catch (e){
            console.warn("Pre-test feed database purge warning:", e.message);
        }
        testUser = await seedTestUser({}, "active");
        authToken = jwt.sign(
            {userId: testUser.id, username: testUser.username},
            ENV.JWT_SECRET,
            {expiresIn: "1d", issuer: "cat-app", audience: "cat-app-users"}
        );
    });

    afterAll(async () =>{
        try{
            await purgeTestUsers();
        } finally {
            if (sql && typeof sql.end === "function") {
                await sql.end();
            }
        }
    });

    it("should return 200 with an empty array when the post has no comments", async ()=>{
        // Convention (see allCommentsController): an existing post with zero
        // comments is a 200 with [], not a 404
        const post = await generateTestPost(testUser.id);

        const response = await request(app)
            .get(`/api/v1/feed/${testUser.username}/posts/${post.id}/comment`)
            .set("Cookie", [`token=${authToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual([]);
    });

    it("should return paginated comments for a post", async ()=>{
        await generateTestPost(testUser.id);
        const postRows = await getPost(testUser.id);
        const targetPostId = postRows[0].id;

        await generateTestComment(testUser.id, targetPostId, "comment 1");
        await generateTestComment(testUser.id, targetPostId, "comment 2");

        const response = await request(app)
            .get(`/api/v1/feed/${testUser.username}/posts/${targetPostId}/comment`)
            .query({page:1, limit:1})
            .set("Cookie", [`token=${authToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it("should return 400 for a non-numeric post id", async ()=>{
        const response = await request(app)
            .get(`/api/v1/feed/${testUser.username}/posts/not-a-number/comment`)
            .set("Cookie", [`token=${authToken}`]);

        expect(response.status).toBe(400);
    });
});
