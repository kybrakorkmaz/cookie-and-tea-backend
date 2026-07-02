import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {purgeTestUsers, seedTestUser} from "./utils/testDb.util.js";
import {createAction, fetchActionsForUser} from "../src/repositories/actions.repository.js";
import jwt from "jsonwebtoken";
import { ENV } from "../env.js";
import { sql } from "../src/db/client.js";
import request from "supertest";
import app from "../src/servers/app.js";

describe("Actions (Notifications) Integration", () => {
    let userA; // actor
    let userB; // target
    let authTokenB;

    beforeAll(async () => {
        try {
            await purgeTestUsers();
        } catch (e) {
            console.warn(e.message);
        }

        userA = await seedTestUser({}, "active");
        userB = await seedTestUser({}, "active");

        authTokenB = jwt.sign({ userId: userB.id, username: userB.username }, ENV.JWT_SECRET, { expiresIn: "1d" });
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

    it("should retrieve actions for target user", async () => {
        await createAction({ actorId: userA.id, targetUserId: userB.id, type: 'follow', message: "User started following" });

        const response = await request(app)
            .get(`/api/v1/actions`)
            .set("Cookie", [`token=${authTokenB}`]);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data[0]).toHaveProperty("actorUsername");
    });

    it("should mark a specific action as read via the endpoint", async () => {
        const action = await createAction({ actorId: userA.id, targetUserId: userB.id, type: 'comment', message: 'unread comment', status: 'unread' });

        // Explicitly test the HTTP PATCH/PUT route responsible for updating status
        const response = await request(app)
            .patch(`/api/v1/actions/${action.id}/read`)
            .set("Cookie", [`token=${authTokenB}`]);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
    });

    it("should purge old read actions", async () => {
        // Create a read action with an old readAt timestamp (15 days ago)
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 15);

        await createAction({ actorId: userA.id, targetUserId: userB.id, type: 'comment', message: 'old comment', status: 'read', readAt: oldDate });

        // Trigger user-scoped or system purge
        const purgeResponse = await request(app)
            .post(`/api/v1/actions/purge-expired`)
            .set("Cookie", [`token=${authTokenB}`]);

        expect(purgeResponse.status).toBe(200);
        expect(purgeResponse.body.status).toBe("success");
        expect(typeof purgeResponse.body.deleted).toBe("number");

        // Ensure old read actions are removed from the user's action feed
        const actionsAfter = await fetchActionsForUser(userB.id);
        const messages = actionsAfter.map(a => a.message);
        expect(messages).not.toContain('old comment');
    });
});