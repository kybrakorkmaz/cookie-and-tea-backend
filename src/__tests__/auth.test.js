import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {db, sql} from "../db/client.js";
import {comments, donations, follows, posts, socials, users} from "../db/schema/index.js";
import {eq, inArray, or} from "drizzle-orm";
import app from "../servers/app.js";
import request from "supertest";
import jwt from "jsonwebtoken";
import {ENV} from "../../env.js";

describe("Auth User Registration Integration Suit with Live Test DB", () =>{
    // data for the setup user
    const setupUsername = "setup_user";

    // data for the HTTP registration test case
    const registerPayload = {
        name: "Register User",
        username: "register_user",
        email: "register@test.com",
        password: "password123",
        confirmPassword: "password123"
    };

    // Helper function to safely purge target test users and all dependencies
    const purgeTestUsers = async () => {
        // Target user records first
        const targetUsers = await db.select({id: users.id})
            .from(users)
            .where(or(eq(users.username, setupUsername), eq(users.username, registerPayload.username)));

        if(targetUsers.length === 0) return;
        const userIds = targetUsers.map(u=>u.id);

        // Clear out explicit child tables lacking automatic cascading options
        await db.delete(donations).where(
            or(inArray(donations.donatorId, userIds), inArray(donations.receiverId, userIds))
        );
        await db.delete(comments).where(inArray(comments.commenterId, userIds));

        // Clear remaining dependent schemas
        await db.delete(socials).where(inArray(socials.userId, userIds));
        await db.delete(follows).where(
            or(inArray(follows.followerId, userIds), inArray(follows.followingId, userIds))
        );
        await db.delete(posts).where(inArray(posts.userId, userIds));

        // finally, safely delete the parent user records
        await db.delete(users).where(inArray(users.id, userIds));
    }
    // Setup: clean previous data and safely isolate environments
    beforeAll(async () =>{
        // Clean out stale data before execution
        await purgeTestUsers();

        // Seed an isolated user instance
        await db.insert(users).values({
            name: "Setup User",
            username: setupUsername,
            email: "setup@test.com",
            hashedPassword: "password123",
            status: "active" // Testing status verification overrides
        });
    });

    afterAll(async () =>{
        try {
            // Sweep clean all modifications made during the test run
            await purgeTestUsers();
        } finally {
            if (sql && typeof sql.end === "function") {
                await sql.end();
            }
        }
    })

    // --- STEP 1: TEST REGISTRATION
    describe("POST /api/v1/auth/sign-up", () =>{
        it("should register a new user with 'pending' status", async () =>{
            // Act: Fire the HTTP integration query sending the mandatory payload body
            const response = await request(app)
                .post("/api/v1/auth/sign-up")
                .send(registerPayload); // Sends the structured JSON payload to trigger Zod safely

            // If it fails, this log will show you exactly what Zod validation or DB error occurred
            if (response.status !== 201) {
                console.error("Signup Failed Payload Error:", response.body);
            }

            // Assert: Validate status and structural integrity of the endpoint response
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("user");
            expect(response.body.user.username).toBe(registerPayload.username);

            // Look up the created user directly in the DB to make sure it saved correctly
            const [dbUser] = await db.select().from(users).where(eq(users.username, registerPayload.username)).limit(1);
            expect(dbUser).toBeDefined();
            expect(dbUser.status).toBe("pending"); // Must start out pending!
        })
    })

    // --- STEP 2: TEST EMAIL VERIFICATION
    describe("GET /api/v1/auth/verify-email", ()=>{
        it("should activate user status when a valid token is provided", async()=>{
            // Fetch the user created in the step above
            const [dbUser] = await db.select().from(users)
                .where(eq(users.username, registerPayload.username))
                .limit(1);
            expect(dbUser).toBeDefined();

            // Generate a valid mock verification token using the target payload pattern
            const mockToken = jwt.sign(
                {userId: dbUser.id, email: dbUser.email},
                ENV.JWT_SECRET,
                {expiresIn: "1d", issuer: "cat-app", audience: "cat-app-users"}
            );

            // Act: send the verification query token via query parameters
            const response = await request(app)
                .get(`/api/v1/auth/verify-email?token=${mockToken}`);

            // Assert response payload values
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.message).toContain("Email successfully");

            // Assert database mutations directly: confirm status transitioned to "active"
            const [updatedDbUser] = await db.select().from(users).where(eq(users.id, dbUser.id)).limit(1);
            expect(updatedDbUser.status).toBe("active");
        });

        it("should return 400 Bad Request if the verification token is missing", async () =>{
            const response = await request(app).get("/api/v1/auth/verify-email?token=invalid_garbage_token");
            expect(response.status).toBe(400);
            expect(response.body.message).toContain("Invalid verification link");
        });
    })
})