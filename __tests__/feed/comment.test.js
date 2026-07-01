import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {generateTestComment, generateTestPost, getPost, purgeTestUsers, seedTestUser} from "../utils/testDb.util.js";
import jwt from "jsonwebtoken";
import { ENV } from "../../env.js";
import { sql } from "../../src/db/client.js";
import request from "supertest";
import app from "../../src/servers/app.js";

describe("Feed Comment Test Cases", () =>{
    let testUser;
    let authToken;
    beforeAll(async () =>{
        try{
            await purgeTestUsers();
        }catch (e){
            console.warn("Pre-test feed database purge warning:",  e.message);
        }
        testUser = await seedTestUser({}, "active");
        authToken = jwt.sign(
            {userId: testUser.id, username: testUser.username},
            ENV.JWT_SECRET,
            {expiresIn: "1d"}
        );
    });

    afterAll(async () =>{
        try {
            await purgeTestUsers();
        }finally{
            if (sql && typeof sql.end === "function") {
                await sql.end();
            }
        }
    })

    describe("POST /api/v1/feed/:username/posts/:id/comment", () =>{
        it("should create a comment", async ()=>{
            await generateTestPost(testUser.id);
            const postRows = await getPost(testUser.id);
            const targetPostId = postRows[0].id;

            const payload = {
                comment: "Feed comment creation"
            };

            const response = await request(app)
                .post(`/api/v1/feed/${testUser.username}/posts/${targetPostId}/comment`)
                .set("Cookie", [`token=${authToken}`])
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data.comment).toBe(payload.comment);
        })
    });

    describe("PUT /api/v1/feed/:username/posts/:id/comment/:id", () =>{
        it("should update a comment" , async () =>{
            await generateTestPost(testUser.id);
            const postRows = await getPost(testUser.id);
            const targetPostId = postRows[0].id;

            const comment = "Feed update comment!";

            const commentIdData = await generateTestComment(testUser.id, targetPostId, comment);
            const commentId = commentIdData.commentId;
            const response = await request(app)
                .put(`/api/v1/feed/${testUser.username}/posts/${targetPostId}/comment/${commentId}`)
                .set("Cookie", [`token=${authToken}`])
                .send({comment:comment});

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.comment).toBe(comment);
        });
    });

    describe("DELETE /api/v1/feed/:username/posts/:id/comment/:id", () =>{
        it("should delete a comment", async () =>{ {
            await generateTestPost(testUser.id);
            const postRows = await getPost(testUser.id);
            const targetPostId = postRows[0].id;
            const comment = "This is a test comment!";
            const commentIdData = await generateTestComment(testUser.id, targetPostId, comment);
            const commentId = commentIdData.commentId;

            const response = await  request(app)
                .delete(`/api/v1/feed/${testUser.username}/posts/${targetPostId}/comment/${commentId}`)
                .set("Cookie", [`token=${authToken}`])
                .send();

            expect(response.status).toBe(204);

            const response1 = await  request(app)
                .get(`/api/v1/feed/${testUser.username}/posts/${targetPostId}/comment/${commentId}`)
                .set("Cookie", [`token=${authToken}`]);

            expect(response1.status).toBe(404);

        }})
    })
});