import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {db, sql} from "../db/client.js";
import {comments, donations, follows, posts, socials, users} from "../db/schema/index.js";
import {eq, inArray, like, or} from "drizzle-orm";
import app from "../servers/app.js";
import request from "supertest";
import jwt from "jsonwebtoken";
import {ENV} from "../../env.js";
import bcrypt from "bcrypt";

describe("Auth User Integration Suit with Live Test DB", () =>{

    // ------------- ARRANGE ---------------------
    // Generate random user to prevent race condition between registration and login
    const generateUserPayload = (overrides = {}) => {
        const uniqueId = Math.floor(Math.random() * 10000); // Prevents unique constraint collisions
        return {
            name: "Test Identity",
            username: `user_${uniqueId}`,
            email: `user_${uniqueId}@test.com`,
            password: "password123",
            confirmPassword: "password123",
            ...overrides // // Merges dynamic inputs (passing specific email formats etc)
        }
    }
    // Cleanup function
    const purgeTestUsers = async () => {
        const targetUsers = await db.select({id: users.id})
            .from(users)
            .where(like(users.username, "user_%"));

        if(targetUsers.length === 0) return;
        const userIds = targetUsers.map(u => u.id);

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
    };
    // Setup: clean previous data and safely isolate environments
    beforeAll(async () =>{
        // Clean out stale data before execution
        await purgeTestUsers();
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

    // ------------- ACT & ASSERT ---------------------
    // --- STEP 1: TEST REGISTRATION
    describe("POST /api/v1/auth/sign-up", () =>{
        it("should register a new user with 'pending' status", async () =>{
            const payload = generateUserPayload();
            // Act: Fire the HTTP integration query sending the mandatory payload body
            const response = await request(app)
                .post("/api/v1/auth/sign-up")
                .send(payload); // Sends the structured JSON payload to trigger Zod safely

            // Assert: Validate status and structural integrity of the endpoint response
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("user");
            expect(response.body.user.username).toBe(payload.username);

            // Look up the created user directly in the DB to make sure it saved correctly
            const [dbUser] = await db.select().from(users).where(eq(users.username, payload.username)).limit(1);
            expect(dbUser).toBeDefined();
            expect(dbUser.status).toBe("pending"); // Must start out pending!
        })
    })

    // --- STEP 2: TEST EMAIL VERIFICATION
    describe("GET /api/v1/auth/verify-email", ()=>{
        it("should activate user status when a valid token is provided", async()=>{
            const payload = generateUserPayload();
            const [seededUser] = await db.insert(users).values({
                name: payload.name,
                username: payload.username,
                email: payload.email,
                hashedPassword: await bcrypt.hash(payload.password, 10),
                status: "pending"
            }).returning();

            // Generate a valid mock verification token using the target payload pattern
            const mockToken = jwt.sign(
                { userId: seededUser.id, email: seededUser.email },
                ENV.JWT_SECRET,
                { expiresIn: "1d", issuer: "cat-app", audience: "cat-app-users" }
            );

            // Act: send the verification query token via query parameters
            const response = await request(app).get(`/api/v1/auth/verify-email?token=${mockToken}`);

            // Assert response payload values
            expect(response.status).toBe(200);
            expect(response.body.message).toBeDefined();
            expect(response.body.status).toBe("success");

            // Assert database mutations directly: confirm status transitioned to "active"
            const [updatedUser] = await db.select().from(users).where(eq(users.id, seededUser.id)).limit(1);
            expect(updatedUser.status).toBe("active");
        });

        it("should return 400 Bad Request if the verification token is invalid", async () =>{
            const response = await request(app).get("/api/v1/auth/verify-email?token=invalid_garbage_token");
            expect(response.status).toBe(400);
            expect(response.body.message).toContain("Invalid verification link");
        });

        it("should return 400 Bad Request if the verification token is missing", async () => {
            const response = await request(app).get("/api/v1/auth/verify-email");
            expect(response.status).toBe(400);
            expect(response.body.message).toBeDefined();
        });
    });

    // -- STEP 3: TEST LOGIN
    describe("GET /api/v1/auth/login", () => {
        it("should log in successfully using a valid USERNAME and set an HTTP-Only cookie", async () =>{
            const payload = generateUserPayload();
            await db.insert(users).values({
                name: payload.name,
                username: payload.username,
                email: payload.email,
                hashedPassword: await bcrypt.hash(payload.password, 10),
                status: "active"
            });

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    identifier: payload.username,
                    password: payload.password
                });
            // Assert response payload values
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            // Assert Cookie Integrity ( Checks headers instead of response  body)
            const cookies = response.headers["set-cookie"];
            expect(cookies).toBeDefined(); // Ensures cookies were sent
            expect(cookies[0]).toContain("token=")   // Ensures your specific cookie name exists
            expect(cookies[0]).toContain("HttpOnly");
        });

        it("should log in successfully using a valid EMAIL address", async () => {
            const payload = generateUserPayload();
            await db.insert(users).values({
                name: payload.name,
                username: payload.username,
                email: payload.email,
                hashedPassword: await bcrypt.hash(payload.password, 10),
                status: "active"
            });

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    identifier: payload.email,
                    password: payload.password
                });
            expect(response.status).toBe(200);

        });

        it("should return 403 Forbidden if a pending user tries to log in", async () => {
            const payload = generateUserPayload();
            await db.insert(users).values({
                name: payload.name,
                username: payload.username,
                email: payload.email,
                hashedPassword: await bcrypt.hash(payload.password, 10),
                status: "pending"
            });

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    identifier: payload.username,
                    password: payload.password
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toBeDefined();
        });
    })
})