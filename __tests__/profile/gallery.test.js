import app from "../../src/servers/app.js";
import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {db, sql} from "../../src/db/client.js";
import {purgeTestUsers, seedCompleteProfileContext} from "../utils/testDb.util.js";
import {createAuthenticatedAgent} from "../utils/auth.util.js";

describe("Profile Gallery Integration Suite", ()=>{
    const uniqueId = Math.floor(Math.random() * 10000);
    const rawPassword = "password123";

    let testUser;
    let authedAgent;

    beforeAll(async () =>{
        await purgeTestUsers();
        const seed = await seedCompleteProfileContext(uniqueId, rawPassword);
        testUser = seed.user;
        authedAgent = await createAuthenticatedAgent(app, testUser.username, rawPassword);
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

    it("should return gallery data (possibly empty images array)", async ()=>{
        const response = await authedAgent.get(`/api/v1/profile/${testUser.username}/gallery`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.userId).toBe(testUser.id);
        expect(Array.isArray(response.body.data.images)).toBe(true);

        // Validate the new paginated metadata contract
        expect(response.body.data.meta).toEqual(
            expect.objectContaining({
                page: 1,
                limit: 20,
                total: expect.any(Number)
            })
        );

        // Assert object keys format to ensure it follows { postId, imageUrl } schema
        if (response.body.data.images.length > 0) {
            expect(response.body.data.images[0]).toEqual(
                expect.objectContaining({
                    postId: expect.anything(),
                    imageUrl: expect.any(String)
                })
            );
        }
    });
});