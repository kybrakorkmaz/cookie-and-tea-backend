import { db } from "../db/client.js";
import { donations, posts, users } from "../db/schema/index.js";
import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const createDonation = async (donatorId, receiverId, amount, postId = null) => {
    return db.transaction(async (tx) => {
        const donation = await tx.insert(donations).values({
            donatorId,
            receiverId,
            amount,
            postId,
        }).returning();

        // Keep the post's donation total in sync so the UI (coin icon) reflects it immediately
        if (postId) {
            await tx.update(posts)
                .set({ donationSum: sql`${posts.donationSum} + ${amount}` })
                .where(eq(posts.id, postId));
        }

        return donation;
    });
};

export const getDonationById = async (donationId) => {
    return db.select().from(donations)
        .where(eq(donations.id, donationId));
};

export const getDonationsByUser = async (userId) => {
    const donator = alias(users, "donator");

    return db.select({
        id: donations.id,
        amount: donations.amount,
        postId: donations.postId,
        createdAt: donations.createdAt,
        donatorId: donations.donatorId,
        receiverId: donations.receiverId,
        donatorName: donator.name,
        donatorUsername: donator.username,
    })
        .from(donations)
        .innerJoin(donator, eq(donations.donatorId, donator.id))
        .where(eq(donations.receiverId, userId))
        .orderBy(desc(donations.createdAt));
};

export const getUserByUsername = async (username) => {
    return db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        iyzicoSubMerchantKey: users.iyzicoSubMerchantKey,
    }).from(users).where(eq(users.username, username));
};

export const getUserById = async (userId) => {
    return db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        iyzicoSubMerchantKey: users.iyzicoSubMerchantKey,
        iyzicoCardUserKey: users.iyzicoCardUserKey,
        iyzicoCardToken: users.iyzicoCardToken,
    }).from(users).where(eq(users.id, userId));
};

export const updateUserSubMerchantKey = async (userId, iyzicoSubMerchantKey) => {
    return db.update(users).set({
        iyzicoSubMerchantKey,
        updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning();
};

export const updateUserCard = async (userId, { iyzicoCardUserKey, iyzicoCardToken }) => {
    return db.update(users).set({
        iyzicoCardUserKey,
        iyzicoCardToken,
        updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning();
};
