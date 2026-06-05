import { index, integer, pgEnum, pgTable, text, unique, check, uniqueIndex } from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import { users } from "./auth.js";
import {actionTimestamp, timestamps} from "./common.js";

// External social media platforms supported by your API
export const socialEnum = pgEnum("social_provider", ["twitter", "instagram", "youtube", "pinterest"]);

export const socials = pgTable("socials", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    socialMedia: socialEnum("social_media").notNull(),
    socialUrl: text("social_url").notNull(), // business account shared by different users so url cannot be unique
    ...timestamps()
},(table) => {
    return {
        // Ensures a single user doesn't duplicate the exact same URL link inside their own profile settings page
        userUrlIdx: uniqueIndex("user_social_url_idx").on(table.userId, table.socialUrl)
    };
});

// Relationship table for Follower/Following logic
export const follows = pgTable("follows", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    followerId: integer("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    followingId: integer("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    ...actionTimestamp()
}, (table) => ({
    followerIdx: index("follower_idx").on(table.followerId),
    followingIdx: index("following_idx").on(table.followingId),
    // Ensures a user cannot follow the same person twice
    uniqueFollow: unique("unique_follow").on(table.followerId, table.followingId),
    // Prevent self-follows
    noSelfFollow: check("no_self_follow", sql`follower_id <> following_id`),
}));

// DM Conversation Room table
export const conversations = pgTable("conversations", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    // Both participants - linked to users table
    userOneId: integer("user_one_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    userTwoId: integer("user_two_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    // Manual integer instead of references() to avoid circular dependency in Drizzle initialization
    lastMessageId: integer("last_message_id"),

    ...actionTimestamp()
}, (table) => ({
    // Ensures only one unique conversation exists between any two users (regardless of order)
    // Uses LEAST/GREATEST to normalize the pair so (1,2) and (2,1) map to the same constraint
    uniqueChat: uniqueIndex("unique_conversation").on(
        sql`LEAST(${table.userOneId}, ${table.userTwoId})`,
        sql`GREATEST(${table.userOneId}, ${table.userTwoId})`
    ),
    userOneIdx: index("user_one_idx").on(table.userOneId),
    userTwoIdx: index("user_two_idx").on(table.userTwoId),
}));

// Individual chat messages within a conversation
export const messages = pgTable("messages", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    conversationId: integer("conversation_id")
        .notNull()
        .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    ...timestamps()
}, (table) => ({
    chatIdx: index("chat_msg_idx").on(table.conversationId),
}));