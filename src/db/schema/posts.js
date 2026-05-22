import { integer, pgEnum, pgTable, text, timestamp, check} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import { users } from "./auth.js";
import { timestamps } from "./common.js";

/*
* For each post:
* max image number is 10, max video number is 5
* "hybrid" means if a post contains both image and video
* Every post has text, but can be empty if it contains media
* Empty posts cannot be published (validation logic in Node/Express controller)
*/
export const postTypeEnum = pgEnum("post_type", ["text", "image", "video", "hybrid"]);

export const posts = pgTable("posts", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: postTypeEnum("type").default("text").notNull(),
    header: text("header").notNull(),
    content: text("content"),

    // Postgres Arrays for media files
    images: text("images").array(),
    videos: text("videos").array(),

    // Counter caches for high-performance feed loading
    commentCount: integer("comment_count").default(0).notNull(),
    donationSum: integer("donation_sum").default(0).notNull(),

    ...timestamps
});

// DONATIONS: Financial records are kept even if the post is gone
export const donations = pgTable("donations", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    // We use "set null" or a specific handling logic if you want
    // the donation record to survive post deletion
    postId: integer("post_id").references(() => posts.id, { onDelete: "set null" }),

    // The person giving the money
    donatorId: integer("donator_id")
        .notNull()
        .references(() => users.id),

    // The person receiving (Post owner)
    receiverId: integer("receiver_id")
        .notNull()
        .references(() => users.id),

    amount: integer("amount").notNull(), // Stored in cents/smallest unit
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, () => ({
    amountCheckConstraint: check("amount_non_negative", sql`amount >= 0`),
}));

export const comments = pgTable("comments", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    postId: integer("post_id")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),

    // The person writing the comment
    commenterId: integer("commenter_id")
        .notNull()
        .references(() => users.id),

    comment: text("comment").notNull(),
    ...timestamps
});