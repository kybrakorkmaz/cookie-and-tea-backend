import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
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
        { expiresIn: "1h" }
    );

describe("Donation Integration Tests", () => {
    let donator;
    let recipient;
    let donatorToken;
    let recipientToken;

    beforeAll(async () => {
        await purgeTestUsers();

        donator = await seedTestUser(
            { stripeConnectId: "acct_test_donator" },
            "active"
        );
        recipient = await seedTestUser(
            { stripeConnectId: "acct_test_recipient" },
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

    describe("GET /api/v1/donate/connect/status", () => {
        it("returns connected=true when user has a Stripe account", async () => {
            const response = await request(app)
                .get("/api/v1/donate/connect/status")
                .set("Cookie", [`token=${donatorToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.connected).toBe(true);
            expect(response.body.data.chargesEnabled).toBe(true);
        });

        it("returns connected=false when user has no Stripe account", async () => {
            const unconnectedUser = await seedTestUser({}, "active");
            const token = signToken(unconnectedUser);

            const response = await request(app)
                .get("/api/v1/donate/connect/status")
                .set("Cookie", [`token=${token}`]);

            expect(response.status).toBe(200);
            expect(response.body.data.connected).toBe(false);
            expect(response.body.data.chargesEnabled).toBe(false);
        });

        it("returns 401 without authentication", async () => {
            const response = await request(app).get("/api/v1/donate/connect/status");
            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/v1/donate/connect", () => {
        it("returns an onboarding URL for unconnected users", async () => {
            const unconnectedUser = await seedTestUser({}, "active");
            const token = signToken(unconnectedUser);

            const response = await request(app)
                .post("/api/v1/donate/connect")
                .set("Cookie", [`token=${token}`]);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.url).toContain("stripe.com");

            const [updatedUser] = await db
                .select({ stripeConnectId: users.stripeConnectId })
                .from(users)
                .where(eq(users.id, unconnectedUser.id));

            expect(updatedUser.stripeConnectId).toBe("acct_test_mock");
        });
    });

    describe("Donation tip endpoints", () => {
        const tipCases = [
            { route: "/api/v1/donate/tip-tea", amountDollars: 5, amountCents: 500 },
            { route: "/api/v1/donate/tip-cookie", amountDollars: 7, amountCents: 700 },
            { route: "/api/v1/donate/tip-cookie-tea", amountDollars: 12, amountCents: 1200 },
        ];

        it.each(tipCases)(
            "POST $route stores a $$amountDollars donation in the database",
            async ({ route, amountDollars, amountCents }) => {
                const response = await request(app)
                    .post(route)
                    .set("Cookie", [`token=${donatorToken}`])
                    .send({ recipientUsername: recipient.username });

                expect(response.status).toBe(200);
                expect(response.body.status).toBe("success");
                expect(response.body.data.amount).toBe(amountDollars);
                expect(response.body.data.paymentIntentId).toBe("pi_test_mock");
                expect(response.body.data.clientSecret).toBe("pi_test_mock_secret");
                expect(response.body.data.donation.amount).toBe(amountCents);
                expect(response.body.data.donation.receiverId).toBe(recipient.id);
                expect(response.body.data.donation.donatorId).toBe(donator.id);

                const [record] = await db
                    .select()
                    .from(donations)
                    .where(eq(donations.id, response.body.data.donation.id));

                expect(record.amount).toBe(amountCents);
            }
        );

        it("rejects donation when donator has no Stripe account", async () => {
            const unconnectedDonator = await seedTestUser({}, "active");
            const token = signToken(unconnectedDonator);

            const response = await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${token}`])
                .send({ recipientUsername: recipient.username });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain("Your Stripe account is not connected");
        });

        it("rejects donation when recipient has no Stripe account", async () => {
            const unconnectedRecipient = await seedTestUser({}, "active");

            const response = await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${donatorToken}`])
                .send({ recipientUsername: unconnectedRecipient.username });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain("Recipient's Stripe account is not connected");
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

    describe("GET /api/v1/donate/history", () => {
        it("returns donations received by the authenticated user", async () => {
            await request(app)
                .post("/api/v1/donate/tip-tea")
                .set("Cookie", [`token=${donatorToken}`])
                .send({ recipientUsername: recipient.username });

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
            const response = await request(app)
                .get("/api/v1/donate/history")
                .set("Cookie", [`token=${donatorToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
        });

        it("returns 401 without authentication", async () => {
            const response = await request(app).get("/api/v1/donate/history");
            expect(response.status).toBe(401);
        });
    });
});
