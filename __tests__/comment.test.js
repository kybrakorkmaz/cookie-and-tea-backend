import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {generateTestComment, generateTestPost, getPost, purgeTestUsers, seedTestUser} from "./utils/testDb.util.js";
import jwt from "jsonwebtoken";
import {ENV} from "../env.js";
import {sql} from "../src/db/client.js";
import request from "supertest";
import app from "../src/servers/app.js";

describe("Post Comment Test Cases", () =>{
    let testUser;
    let authToken;
    beforeAll(async () =>{
        try{
            await purgeTestUsers();
        }catch (e){
            console.warn("Pre-test profile database purge warning:",  e.message);
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
        }catch (e){
            if (sql && typeof sql.end === "function") {
                await sql.end();
            }
        }
    })
    describe("GET /api/v1/profile/:username/posts/:id/comment/", () =>{
        it("should create a comment", async ()=>{
            await generateTestPost(testUser.id);

            const postRows = await getPost(testUser.id);
            const targetPostId = postRows[0].id;

            const payload = {
                comment: "Very beautiful work, good job!"
            };

            const response = await request(app)
                .post(`/api/v1/profile/${testUser.username}/posts/${targetPostId}/comment`)
                .set("Cookie", [`token=${authToken}`])
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data.comment).toBe(payload.comment);

        })
    });

    describe("PUT /api/v1/profile/:username/posts/:id/comment/:id", () =>{
        it("should update a comment" , async () =>{
            await generateTestPost(testUser.id);

            const postRows = await getPost(testUser.id);
            const targetPostId = postRows[0].id;

            const comment = "This is a test comment!";

            const commentIdData = await generateTestComment(testUser.id, targetPostId, comment);
            const commentId = commentIdData.commentId;
            const response = await request(app)
                .put(`/api/v1/profile/${testUser.username}/posts/${targetPostId}/comment/${commentId}`)
                .set("Cookie", [`token=${authToken}`])
                .send({comment:comment});

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.comment).toBe(comment);
        });
        // TODO feed update comment
    });

    describe("DELETE /api/v1/profile/:username/posts/:id/comment/:id", () =>{
        it("should delete a comment", async () =>{{
            await generateTestPost(testUser.id);
            const postRows = await getPost(testUser.id);
            const targetPostId = postRows[0].id;
            const comment = "This is a test comment!";
            const commentIdData = await generateTestComment(testUser.id, targetPostId, comment);
            const commentId = commentIdData.commentId;

            const response = await  request(app)
                .delete(`/api/v1/profile/${testUser.username}/posts/${targetPostId}/comment/${commentId}`)
                .set("Cookie", [`token=${authToken}`])
                .send();

            expect(response.status).toBe(204);

            // Verify the post's commentCount was decremented
            const postAfterDelete = await getPost(testUser.id);
            expect(postAfterDelete[0].commentCount).toBe(0);

            const response1 = await  request(app)
                .get(`/api/v1/profile/${testUser.username}/posts/${targetPostId}/comment/${commentId}`)
                .set("Cookie", [`token=${authToken}`]);

            expect(response1.status).toBe(404);

        }})
    })
})