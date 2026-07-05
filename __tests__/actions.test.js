import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { purgeTestUsers, seedTestUser, generateTestPost } from "./utils/testDb.util.js";
import { createAction, fetchActionsForUser } from "../src/repositories/actions.repository.js";
import jwt from "jsonwebtoken";
import { ENV } from "../env.js";
import { sql } from "../src/db/client.js";
import request from "supertest";
import app from "../src/servers/app.js";

const signToken = (user) =>
    jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        ENV.JWT_SECRET,
        { expiresIn: "1d" }
    );

describe("Actions (Notifications) Integration", () => {
    let userA;
    let userB;
    let authTokenA;
    let authTokenB;

    beforeAll(async () => {
        try {
            await purgeTestUsers();
        } catch (e) {
            console.warn(e.message);
        }

        userA = await seedTestUser({}, "active");
        userB = await seedTestUser({}, "active");

        authTokenA = signToken(userA);
        authTokenB = signToken(userB);
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

    it("should retrieve received actions for target user", async () => {
        await createAction({ actorId: userA.id, targetUserId: userB.id, type: "follow", message: "started following you" });

        const response = await request(app)
            .get("/api/v1/actions")
            .set("Cookie", [`token=${authTokenB}`]);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data[0]).toMatchObject({
            type: "follow",
            action: "started following you",
            actor: { username: userA.username },
        });
    });

    it("should return empty array when user has no actions", async () => {
        const response = await request(app)
            .get("/api/v1/actions")
            .set("Cookie", [`token=${authTokenA}`]);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });

    it("should retrieve sent actions with scope=sent", async () => {
        const response = await request(app)
            .get("/api/v1/actions?scope=sent")
            .set("Cookie", [`token=${authTokenA}`]);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].type).toBe("follow");
    });

    it("should mark a specific action as read via PUT", async () => {
        const [action] = await createAction({
            actorId: userA.id,
            targetUserId: userB.id,
            type: "comment",
            message: "unread comment",
            status: "unread",
        });

        const response = await request(app)
            .put(`/api/v1/actions/${action.id}/read`)
            .set("Cookie", [`token=${authTokenB}`]);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.status).toBe("read");
    });

    it("should create a follow action when user follows another", async () => {
        const follower = await seedTestUser({}, "active");
        const target = await seedTestUser({}, "active");
        const token = signToken(follower);

        const response = await request(app)
            .post(`/api/v1/profile/${target.username}/follow`)
            .set("Cookie", [`token=${token}`]);

        expect(response.status).toBe(201);

        const actions = await fetchActionsForUser(target.id);
        expect(actions.some(a => a.type === "follow" && a.actorId === follower.id)).toBe(true);
    });

    it("should create a comment action when user comments on a post", async () => {
        const commenter = await seedTestUser({}, "active");
        const author = await seedTestUser({}, "active");
        const token = signToken(commenter);
        const post = await generateTestPost(author.id);

        const response = await request(app)
            .post(`/api/v1/profile/${author.username}/posts/${post.id}/comment`)
            .set("Cookie", [`token=${token}`])
            .send({ comment: "Great post!" });

        expect(response.status).toBe(201);

        const actions = await fetchActionsForUser(author.id);
        const commentAction = actions.find(a => a.type === "comment");
        expect(commentAction).toBeDefined();
        expect(commentAction.message).toBe("Great post!");
    });

    it("should purge old read actions", async () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 15);

        await createAction({
            actorId: userA.id,
            targetUserId: userB.id,
            type: "comment",
            message: "old comment",
            status: "read",
            readAt: oldDate,
        });

        const purgeResponse = await request(app)
            .post("/api/v1/actions/purge-expired")
            .set("Cookie", [`token=${authTokenB}`]);

        expect(purgeResponse.status).toBe(200);
        expect(purgeResponse.body.status).toBe("success");
        expect(typeof purgeResponse.body.deleted).toBe("number");

        const actionsAfter = await fetchActionsForUser(userB.id);
        const messages = actionsAfter.map(a => a.message);
        expect(messages).not.toContain("old comment");
    });
});
