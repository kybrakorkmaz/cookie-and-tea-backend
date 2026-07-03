import { db } from "../db/client.js";
import { donations, users } from "../db/schema/index.js";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const createDonation = async (donatorId, receiverId, amount, postId = null) => {
    return db.insert(donations).values({
        donatorId,
        receiverId,
        amount,
        postId,
    }).returning();
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
        stripeConnectId: users.stripeConnectId,
    }).from(users).where(eq(users.username, username));
};

export const getUserById = async (userId) => {
    return db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        stripeConnectId: users.stripeConnectId,
    }).from(users).where(eq(users.id, userId));
};

export const updateUserStripeId = async (userId, stripeConnectId) => {
    return db.update(users).set({
        stripeConnectId,
        updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning();
};
