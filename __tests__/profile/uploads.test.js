import app from "../../src/servers/app.js";
import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import request from "supertest";
import {db, sql} from "../../src/db/client.js";
import {users} from "../../src/db/schema/index.js";
import {eq} from "drizzle-orm";
import {purgeTestUsers, seedTestUser} from "../utils/testDb.util.js";
import {createAuthenticatedAgent} from "../utils/auth.util.js";

// Minimal valid PNG (1x1 transparent pixel) — enough for multer's mimetype check
const PNG_BUFFER = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64"
);
// Resolved value returned by the globally mocked uploadToCloudinary (see __tests__/setup/cloudinary.js)
const MOCK_CLOUDINARY_URL = "https://res.cloudinary.com/mock-cloud/image/upload/fake_file.png";

describe("Profile Image Upload Integration Suite", () => {
    const rawPassword = "password123";
    let testUser;
    let authedAgent;

    beforeAll(async () => {
        await purgeTestUsers();
        testUser = await seedTestUser({}, "active");
        authedAgent = await createAuthenticatedAgent(app, testUser.username, rawPassword);
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

    it("should upload a profile photo and persist the Cloudinary URL", async () => {
        const response = await authedAgent
            .post("/api/v1/profile/photo")
            .attach("file", PNG_BUFFER, {filename: "avatar.png", contentType: "image/png"});

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.profileImage).toBe(MOCK_CLOUDINARY_URL);

        // Assert database mutation directly
        const [dbUser] = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
        expect(dbUser.profileImage).toBe(MOCK_CLOUDINARY_URL);
    });

    it("should upload a cover image and persist the Cloudinary URL", async () => {
        const response = await authedAgent
            .post("/api/v1/profile/cover")
            .attach("file", PNG_BUFFER, {filename: "cover.png", contentType: "image/png"});

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.backgroundImage).toBe(MOCK_CLOUDINARY_URL);

        const [dbUser] = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
        expect(dbUser.backgroundImage).toBe(MOCK_CLOUDINARY_URL);
    });

    it("should return 400 when no file is attached", async () => {
        const response = await authedAgent.post("/api/v1/profile/photo");

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("No image file provided");
    });

    it("should reject non-image uploads with 400", async () => {
        const response = await authedAgent
            .post("/api/v1/profile/photo")
            .attach("file", Buffer.from("plain text payload"), {filename: "notes.txt", contentType: "text/plain"});

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("Only image files are allowed");
    });

    it("should return 401 when unauthenticated", async () => {
        const response = await request(app)
            .post("/api/v1/profile/photo")
            .attach("file", PNG_BUFFER, {filename: "avatar.png", contentType: "image/png"});

        expect(response.status).toBe(401);
    });
});
