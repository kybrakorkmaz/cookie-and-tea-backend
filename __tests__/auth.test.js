import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {db, sql} from "../src/db/client.js";
import {comments, donations, follows, posts, socials, users} from "../src/db/schema/index.js";
import {eq, inArray, like, or} from "drizzle-orm";
import app from "../src/servers/app.js";
import request from "supertest";
import jwt from "jsonwebtoken";
import {ENV} from "../env.js";
import bcrypt from "bcrypt";
import {purgeTestUsers, seedTestUser} from "./utils/testDb.util.js";

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

        it("should reject registration when username is already taken", async () => {
            const payload = generateUserPayload();
            // Assert baseline registration succeeds before verifying unique blocks
            const setupResponse = await request(app).post("/api/v1/auth/sign-up").send(payload);
            expect(setupResponse.status).toBe(201);

            // attempt register with same username but different email
            const payload2 = generateUserPayload({ username: payload.username, email: `other_${payload.email}` });
            const response = await request(app).post("/api/v1/auth/sign-up").send(payload2);

            expect(response.status).toBe(400);
            expect(response.body.message).toBeDefined();
            expect(response.body.message).toContain("Username");
        });

        it("should reject registration when email is already in use", async () => {
            const payload = generateUserPayload();
            // Assert baseline registration succeeds before verifying unique blocks
            const setupResponse = await request(app).post("/api/v1/auth/sign-up").send(payload);
            expect(setupResponse.status).toBe(201);

            // attempt register with same email but different username
            const payload2 = generateUserPayload({ username: `other_${payload.username}`, email: payload.email });
            const response = await request(app).post("/api/v1/auth/sign-up").send(payload2);

            expect(response.status).toBe(400);
            expect(response.body.message).toBeDefined();
            expect(response.body.message).toContain("Email");
        });
    })

    // --- STEP 2: TEST EMAIL VERIFICATION
    describe("GET /api/v1/auth/verify-email", ()=>{
        it("should activate user status when a valid token is provided", async()=>{
            // Factory handles context creation and password hashing automatically
            const seededUser = await seedTestUser({}, "pending");

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
    describe("POST /api/v1/auth/login", () => {
        it("should log in successfully using a valid USERNAME and set an HTTP-Only cookie", async () =>{
            const testUser = await seedTestUser({}, "active");

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    identifier: testUser.username,
                    password: testUser.rawPassword
                });
            // Assert response payload values
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            // Assert Cookie Integrity ( Checks headers instead of response  body)
            const cookies = response.headers["set-cookie"];
            expect(cookies).toBeDefined(); // Ensures cookies were sent
            expect(cookies[0]).toMatch(/^token=/); // Ensures your exact cookie name exists at the start
            expect(cookies[0]).toContain("HttpOnly");
            expect(cookies[0]).toContain("Path=/");
        });

        it("should log in successfully using a valid EMAIL address", async () => {
            const testUser = await seedTestUser({}, "active");

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    identifier: testUser.email,
                    password: testUser.rawPassword
                });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");

            const cookies = response.headers["set-cookie"];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toMatch(/^token=/);
            expect(cookies[0]).toContain("HttpOnly");
            expect(cookies[0]).toContain("Path=/");
        });

        it("should return 401 Unauthorized on invalid password credentials", async () => {
            const testUser = await seedTestUser({}, "active");

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    identifier: testUser.username,
                    password: "wrongPassword123"
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBeDefined();
        });

        it("should return 403 Forbidden if a pending user tries to log in", async () => {
            const testUser = await seedTestUser({}, "pending");

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    identifier: testUser.username,
                    password: testUser.rawPassword
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toBeDefined();
        });
    });
    // -- STEP 4: TEST LOGOUT
    describe("POST /api/v1/auth/logout", () =>{
        it("should logout successfully", async () =>{
            await seedTestUser({}, "active");

            const response = await request(app)
                .post("/api/v1/auth/logout")
                .send();
            //

            // Assert response status
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Logged out successfully.");

            // Assert Cookie clearance configuration
            const cookies = response.headers["set-cookie"];
            expect(cookies).toBeDefined();

            // Check that it's clearing the token specifically
            expect(cookies[0]).toMatch(/^token=/);

            // Verify the browser is instructed to expire it instantly
            // (Express handles this by setting maxAge to 0 or mapping a 1970 Epoch expiration date
            expect(cookies[0]).toMatch(/Max-Age=0/i);
            expect(cookies[0]).toContain("HttpOnly");
            expect(cookies[0]).toContain("SameSite=Strict");
        });
    })

    // -- STEP 5: FULL LIFECYCLE PROTECTED ROUTE VALIDATION
    describe("Session Lifecycle Verification via Protected Profile Route", () => {
        it("should grant access to profile when logged in, and cleanly revoke access after logging out", async () => {
            const agent = request.agent(app);
            const testUser = await seedTestUser({}, "active");

            // 1. Log In to acquire the session cookie inside the agent tracking layer
            await agent
                .post("/api/v1/auth/login")
                .send({
                    identifier: testUser.username,
                    password: testUser.rawPassword
                });

            // 2. Try to access the newly protected profile endpoint
            const profileResponseBefore = await agent.get(`/api/v1/profile/${testUser.username}`);
            expect(profileResponseBefore.status).toBe(200);
            expect(profileResponseBefore.body).toBeDefined(); // Adjust this depending on what getUserPanel returns

            // 3. Fire the logout request to destroy the cookie
            await agent.post("/api/v1/auth/logout").send();

            // 4. Try to hit the protected endpoint again now that the cookie is cleared
            const profileResponseAfter = await agent.get(`/api/v1/profile/${testUser.username}`);
            expect(profileResponseAfter.status).toBe(401); // Asserts security successfully blocked access!
        });
    });
})