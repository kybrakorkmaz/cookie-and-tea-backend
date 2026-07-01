import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {generateTestComment, generateTestPost, getPost, purgeTestUsers, seedTestUser} from "../utils/testDb.util.js";
import jwt from "jsonwebtoken";
import { ENV } from "../../env.js";
import { sql } from "../../src/db/client.js";
import request from "supertest";
import app from "../../src/servers/app.js";

describe("Profile Preview Comments Integration", () =>{
    let testUser;
    let authToken;

    beforeAll(async () =>{
        try{
            await purgeTestUsers();
        }catch (e){
            console.warn("Pre-test profile database purge warning:", e.message);
        }
        testUser = await seedTestUser({}, "active");
        authToken = jwt.sign(
            {userId: testUser.id, username: testUser.username},
            ENV.JWT_SECRET,
            {expiresIn: "1d"}
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

    it("should return 404 when no preview comments exist", async ()=>{
        const response = await request(app)
            .get(`/api/v1/profile/${testUser.username}/posts/preview`)
            .set("Cookie", [`token=${authToken}`]);

        expect(response.status).toBe(404);
    });

    it("should return preview comments when they exist", async ()=>{
        await generateTestPost(testUser.id);
        const postRows = await getPost(testUser.id);
        const targetPostId = postRows[0].id;

        await generateTestComment(testUser.id, targetPostId, "Preview comment 1");

        const response = await request(app)
            .get(`/api/v1/profile/${testUser.username}/posts/preview`)
            .set("Cookie", [`token=${authToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data[0]).toHaveProperty("postId");
        expect(response.body.data[0]).toHaveProperty("comment");
    });
});