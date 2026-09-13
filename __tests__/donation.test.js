import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { eq } from "drizzle-orm";
import app from "../src/servers/app.js";
import { db, sql } from "../src/db/client.js";
import { donations, users } from "../src/db/schema/index.js";
import { ENV } from "../env.js";
import { purgeTestUsers, seedTestUser } from "./utils/testDb.util.js";

const signToken = (user) =>
    jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        ENV.JWT_SECRET,
        { expiresIn: "1h", issuer: "cat-app", audience: "cat-app-users" }
    );

describe("Donation Integration Tests", () => {
    let donator;
    let recipient;
    let donatorToken;
    let recipientToken;

    beforeAll(async () => {
        await purgeTestUsers();

        donator = await seedTestUser(
            { iyzicoCardUserKey: "card_user_test_donator", iyzicoCardToken: "card_token_test_donator" },
            "active"
        );
        recipient = await seedTestUser(
            { iyzicoSubMerchantKey: "sub_merchant_test_recipient" },
            "active"
        );

        donatorToken = signToken(donator);
        recipientToken = signToken(recipient);
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

    describe("GET /api/v1/donate/card/status", () => {
        it("returns connected=true when donator already tokenized a card", async () => {
            const response = await request(app)
                .get("/api/v1/donate/card/status")
                .set("Cookie", [`token=${donatorToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.connected).toBe(true);
        });

        it("returns connected=false when user has no tokenized card", async () => {
            const noCardUser = await seedTestUser({}, "active");
            const token = signToken(noCardUser);

            const response = await request(app)
                .get("/api/v1/donate/card/status")
                .set("Cookie", [`token=${token}`]);

            expect(response.status).toBe(200);
            expect(response.body.data.connected).toBe(false);
        });

        it("returns 401 without authentication", async () => {
            const response = await request(app).get("/api/v1/donate/card/status");
            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/v1/donate/card", () => {
        it("tokenizes and stores the user's card via Iyzico", async () => {
            const noCardUser = await seedTestUser({}, "active");
            const token = signToken(noCardUser);

            const response = await request(app)
                .post("/api/v1/donate/card")
                .set("Cookie", [`token=${token}`])
                .send({
                    cardHolderName: "Test User",
                    cardNumber: "5528790000000008",
                    expireMonth: "12",
                    expireYear: "2030",
                    cvc: "123",
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.cardUserKey).toBe("card_user_test_mock");

            const [updatedUser] = await db
                .select({ iyzicoCardToken: users.iyzicoCardToken })
                .from(users)
                .where(eq(users.id, noCardUser.id));

            expect(updatedUser.iyzicoCardToken).toBe("card_token_test_mock");
        });
    });

    describe("POST /api/v1/donate/connect", () => {
        it("onboards a user as an Iyzico sub-merchant", async () => {
            const unconnectedUser = await seedTestUser({}, "active");
            const token = signToken(unconnectedUser);

            // The service requires mandatory bank details before it ever calls Iyzico
            const response = await request(app)
                .post("/api/v1/donate/connect")
                .set("Cookie", [`token=${token}`])
                .send({
                    gsmNumber: "+905551112233",
                    identityNumber: "12345678901",
                    iban: "TR330006100519786457841326",
                    address: "Test Address 1"
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            // MOCK_IYZICO=true short-circuits with a generated key; otherwise the
            // iyzico config mock returns "sub_merchant_test_mock" — either way it persists
            expect(response.body.data.subMerchantKey).toBeDefined();

            const [updatedUser] = await db
                .select({ iyzicoSubMerchantKey: users.iyzicoSubMerchantKey })
                .from(users)
                .where(eq(users.id, unconnectedUser.id));
            expect(updatedUser.iyzicoSubMerchantKey).toBe(response.body.data.subMerchantKey);
        });

        it("returns 400 when mandatory bank details are missing", async () => {
            const unconnectedUser = await seedTestUser({}, "active");
            const token = signToken(unconnectedUser);

            const response = await request(app)
                .post("/api/v1/donate/connect")
                .set("Cookie", [`token=${token}`])
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toContain("Missing mandatory bank details");
        });
    });

    describe("Donation tip endpoints (3D Secure initiate)", () => {
        const tipCases = [
            { route: "/api/v1/donate/tip-tea", amountDollars: 5 },
            { route: "/api/v1/donate/tip-cookie", amountDollars: 7 },
            { route: "/api/v1/donate/tip-cookie-tea", amountDollars: 12 },
        ];

        it.each(tipCases)(
            "POST $route returns Iyzico's 3D Secure confirmation content",
            async ({ route }) => {
                const response = await request(app)
                    .post(route)
                    .set("Cookie", [`token=${donatorToken}`])
                    .send({ recipientUsername: recipient.username });

                expect(response.status).toBe(200);
                expect(response.body.status).toBe("success");
                expect(response.body.data.requires3ds).toBe(true);
                expect(response.body.data.htmlContent).toBeTruthy();
                expect(response.body.data.conversationId).toBeTruthy();
            }
        );

        it("rejects donation when donator has no tokenized card", async () => {
            const noCardDonator = await seedTestUser({}, "active");
            const token = signToken(noCardDonator);

            const response = await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${token}`])
                .send({ recipientUsername: recipient.username });

            expect(response.status).toBe(400);
            // Updated to match the strict service error payload
            expect(response.body.message).toBe("Please save a card before donating.");
        });

        it("rejects donation when recipient has no Iyzico sub-merchant connection", async () => {
            const unconnectedRecipient = await seedTestUser({}, "active");

            const response = await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${donatorToken}`])
                .send({ recipientUsername: unconnectedRecipient.username });

            expect(response.status).toBe(400);
            // Updated to match the strict service error payload
            expect(response.body.message).toBe("Recipient cannot receive tips yet.");
        });

        it("rejects self-donation", async () => {
            const response = await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${donatorToken}`])
                .send({ recipientUsername: donator.username });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("You cannot donate to yourself");
        });

        it("returns 404 for unknown recipient", async () => {
            const response = await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${donatorToken}`])
                .send({ recipientUsername: "nonexistent_user_xyz" });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Recipient user not found");
        });

        it("returns 400 for invalid request body", async () => {
            const response = await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${donatorToken}`])
                .send({ recipientUsername: "ab" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Validation failed");
        });

        it("returns 401 without authentication", async () => {
            const response = await request(app)
                .post("/api/v1/donate/tip-tea")
                .send({ recipientUsername: recipient.username });

            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/v1/donate/callback (Iyzico 3DS confirmation)", () => {
        it("finalizes the payment and records the donation after 3DS confirmation", async () => {
            const initiateResponse = await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${donatorToken}`])
                .send({ recipientUsername: recipient.username });

            const { conversationId } = initiateResponse.body.data;

            // Mock-mode callbacks must carry the HMAC signature the server
            // embedded in the generated mock 3DS page — simulate that here
            const mockToken = crypto
                .createHmac("sha256", ENV.JWT_SECRET)
                .update(conversationId)
                .digest("hex");

            const callbackResponse = await request(app)
                .post("/api/v1/donate/callback")
                .send({ conversationId, status: "success", mdStatus: "1", paymentId: "payment_test_mock", mockToken });

            expect(callbackResponse.status).toBe(200);
            expect(callbackResponse.text).toContain("iyzico-donation-result");

            const [record] = await db
                .select()
                .from(donations)
                .where(eq(donations.receiverId, recipient.id));

            expect(record.amount).toBe(500);
        });

        it("rejects callback for unknown conversationId", async () => {
            const response = await request(app)
                .post("/api/v1/donate/callback")
                .send({ conversationId: "unknown-id", status: "success", mdStatus: "1", paymentId: "x" });

            expect(response.status).toBe(400);
            expect(response.text).toContain("\"success\":false");
        });

        it("rejects a forged mock callback without a valid mockToken", async () => {
            // Start a real tip so a valid pending session exists
            const initiateResponse = await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${donatorToken}`])
                .send({ recipientUsername: recipient.username });

            const { conversationId } = initiateResponse.body.data;

            const countBefore = (await db
                .select()
                .from(donations)
                .where(eq(donations.receiverId, recipient.id))).length;

            // Attack: replay the callback with a guessed/missing signature
            const forged = await request(app)
                .post("/api/v1/donate/callback")
                .send({ conversationId, status: "success", mdStatus: "1", paymentId: "forged" });

            expect(forged.status).toBe(400);

            // The forged callback must not record a donation
            const countAfter = (await db
                .select()
                .from(donations)
                .where(eq(donations.receiverId, recipient.id))).length;
            expect(countAfter).toBe(countBefore);
        });
    });

    describe("GET /api/v1/donate/history", () => {
        it("returns donations received by the authenticated user", async () => {
            const initiateResponse = await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${donatorToken}`])
                .send({ recipientUsername: recipient.username });

            const historyConversationId = initiateResponse.body.data.conversationId;
            const historyMockToken = crypto
                .createHmac("sha256", ENV.JWT_SECRET)
                .update(historyConversationId)
                .digest("hex");

            await request(app)
                .post("/api/v1/donate/callback")
                .send({
                    conversationId: historyConversationId,
                    status: "success",
                    mdStatus: "1",
                    paymentId: "payment_test_mock",
                    mockToken: historyMockToken,
                });

            const response = await request(app)
                .get("/api/v1/donate/history")
                .set("Cookie", [`token=${recipientToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);

            const latest = response.body.data[0];
            expect(latest.amount).toBe(500);
            expect(latest.amountDollars).toBe(5);
            expect(latest.status).toBe("paid");
            expect(latest.donator.username).toBe(donator.username);
            expect(latest.donator.name).toBe(donator.name);
        });

        it("returns an empty array when user has no received donations", async () => {
            const isolatedRecipient = await seedTestUser({}, "active");
            const token = signToken(isolatedRecipient);

            const response = await request(app)
                .get("/api/v1/donate/history")
                .set("Cookie", [`token=${token}`]);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
        });

        it("returns 401 without authentication", async () => {
            const response = await request(app).get("/api/v1/donate/history");
            expect(response.status).toBe(401);
        });
    });
});