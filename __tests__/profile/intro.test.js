import request from "supertest";
import app from "../../src/servers/app.js";
import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {follows, posts, socials, users} from "../../src/db/schema/index.js";
import {db, sql} from "../../src/db/client.js";
import {eq, or} from "drizzle-orm";
import {ENV} from "../../env.js";
import jwt from "jsonwebtoken";
import {purgeTestUsers, seedCompleteProfileContext} from "../utils/testDb.util.js";
import {createAuthenticatedAgent} from "../utils/auth.util.js";

describe("Profile Integration Suite with Live Test DB", ()=>{
    const uniqueId = Math.floor(Math.random() * 10000);
    const rawPassword = "password123";

    let testUser;
    let testFollower;
    let authedAgent;

    // Setup phase: Clean up previous data and insert mock records honoring all PG constraints
    beforeAll(async () =>{
        // Wipe clean any stale elements using the common helper
        await purgeTestUsers();

        // Insert the root user matching the database schemas logic
        const seed = await seedCompleteProfileContext(uniqueId, rawPassword);
        testUser = seed.user;
        testFollower = seed.follower;

        //Sprout a pre-authenticated agent session using our shared tool
        authedAgent = await createAuthenticatedAgent(app, testUser.username, rawPassword);
    });

    // Teardown phase: Cascading deletes via references clear everything cleanly
    afterAll(async () =>{
        try {
            // cleanup
            await purgeTestUsers();
        } finally {
            // Safely terminate the open TCP sockets pool
            // Wrapping this in a finally block guarantees the socket closes even if a query breaks.
            if (sql && typeof sql.end === "function") {
                await sql.end();
            }
        }
    });

    // --- TEST SUITE FOR USER PANEL ---
    describe( "GET /api/v1/profile/:username", ()=>{
        it("should resolve HTTP 200 and serve the matched panel information block", async () => {
            const response = await authedAgent.get(`/api/v1/profile/${testUser.username}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: testUser.id,
                name: "Kubra Korkmaz",
                username: testUser.username,
                profileImage: "profile.png",
                backgroundImage: "bg.png",
                // Viewing your own profile: ownership flag on, follow flag off
                isOwnProfile: true,
                isFollowing: false
            });
        });
        it("should validate missing inputs and return HTTP 400 Bad Request", async () => {
            const response = await authedAgent.get("/api/v1/profile/%20") // No query parameters
            expect(response.status).toBe(400);
            // Change this assertion to look for the error wrapper property returned by your errorHandler
            expect(response.body).toHaveProperty("message");
        });

        it("should return HTTP 401 Unauthorized if the authentication cookie is missing completely", async () => {
            const response = await request(app).get(`/api/v1/profile/${testUser.username}`);
            expect(response.status).toBe(401);
        });
    });

    // --- TEST SUITE FOR USER INTRO DASHBOARD ---
    describe("GET /api/v1/profile/:username/intro", () => {
        it("should resolve HTTP 200 and combine socials, earnings, and connections", async ()=>{
            // Act: Fire the HTTP integrations query hitting your real controllers
            const response = await authedAgent
                .get(`/api/v1/profile/${testUser.username}/intro`)
                .query({ earningTimeline: "30", isFollower: "true" }); // or however your controller expects the lookup key (query, params, or session context)

            // Assert: Verify structural values returned straight out of PG
            expect(response.status).toBe(200);

            // Validate structural fields matched to your getIntroDashboard service mapper
            expect(response.body.about).toBe("Full-Stack Software Developer");
            expect(response.body.earningsTotal).toBe(50);

            expect(Array.isArray(response.body.socials)).toBe(true);
            expect(response.body.socials[0].socialMedia).toBe("youtube");

            expect(Array.isArray(response.body.topSupportedPosts)).toBe(true);
            expect(response.body.topSupportedPosts[0].header).toBe("First Tea Post");

            expect(Array.isArray(response.body.recentConnections)).toBe(true);
            expect(response.body.recentConnections[0].username).toBe(`test_follower_${uniqueId}`);
        });

        it("should omit earningsTotal when a non-owner views the intro", async () => {
            const followerAgent = await createAuthenticatedAgent(
                app,
                testFollower.username,
                rawPassword
            );

            const response = await followerAgent
                .get(`/api/v1/profile/${testUser.username}/intro`)
                .query({ earningTimeline: "30", isFollower: "true" });

            expect(response.status).toBe(200);
            expect(response.body).not.toHaveProperty("earningsTotal");
            expect(response.body.about).toBe("Full-Stack Software Developer");
        });
    });

    describe("GET /api/v1/profile/:username/intro/follow", () => {
        it("should return an empty list when the owner follows nobody", async () => {
            const response = await authedAgent.get(`/api/v1/profile/${testUser.username}/intro/follow`);

            expect(response.status).toBe(200);
            expect(response.body.follow).toEqual([]);
        });
    });

    // --- TEST SUITE FOR INTRO UPDATES (about / socials) ---
    describe("PUT /api/v1/profile/:username/intro/about", () => {
        it("should update the about text on the own profile", async () => {
            const response = await authedAgent
                .put(`/api/v1/profile/${testUser.username}/intro/about`)
                .send({ about: "Updated bio text" });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.about).toBe("Updated bio text");

            // Assert database mutation directly
            const [dbUser] = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
            expect(dbUser.about).toBe("Updated bio text");
        });

        it("should return 403 when editing someone else's about", async () => {
            const response = await authedAgent
                .put(`/api/v1/profile/${testFollower.username}/intro/about`)
                .send({ about: "Hacked bio" });

            expect(response.status).toBe(403);
        });

        it("should return 401 when unauthenticated", async () => {
            const response = await request(app)
                .put(`/api/v1/profile/${testUser.username}/intro/about`)
                .send({ about: "No session bio" });

            expect(response.status).toBe(401);
        });
    });

    describe("PUT /api/v1/profile/:username/intro/socials", () => {
        it("should replace the socials list on the own profile", async () => {
            const response = await authedAgent
                .put(`/api/v1/profile/${testUser.username}/intro/socials`)
                .send({
                    socials: [
                        { socialMedia: "youtube", socialUrl: "https://youtube.com/@updated" },
                        { socialMedia: "instagram", socialUrl: "https://instagram.com/updated" }
                    ]
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(Array.isArray(response.body.socials)).toBe(true);

            const dbSocials = await db.select().from(socials).where(eq(socials.userId, testUser.id));
            expect(dbSocials.length).toBe(2);
        });

        it("should reject an unsupported platform with 400", async () => {
            const response = await authedAgent
                .put(`/api/v1/profile/${testUser.username}/intro/socials`)
                .send({ socials: [{ socialMedia: "myspace", socialUrl: "https://myspace.com/x" }] });

            expect(response.status).toBe(400);
        });

        it("should return 403 when editing someone else's socials", async () => {
            const response = await authedAgent
                .put(`/api/v1/profile/${testFollower.username}/intro/socials`)
                .send({ socials: [{ socialMedia: "youtube", socialUrl: "https://youtube.com/@hack" }] });

            expect(response.status).toBe(403);
        });
    });
})