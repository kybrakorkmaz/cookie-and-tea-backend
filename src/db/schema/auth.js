import {
    index,
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar
} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";
import {comments, donations, posts} from "./posts.js";
import {follows, socials} from "./profile.js";
import {timestamps} from "./common.js";

// Defined roles for access control in Express middleware
export const roleEnum = pgEnum("role", ["user", "admin"]);

// Primary user table - renamed to 'users' to avoid Postgres reserved word conflicts
export const users = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 255 }).notNull(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    role: roleEnum("role").default("user").notNull(),
    hashedPassword: varchar("hashed_password", { length: 255 }).notNull(),
    profileImage: text("profile_image"),
    backgroundImage: text("background_image"),
    about: text("about"),

    // Performance Optimization: Cache counts here so you don't
    // have to run a COUNT(*) query on every profile load.
    followerCount: integer("follower_count").default(0).notNull(),
    followingCount: integer("following_count").default(0).notNull(),

    ...timestamps,
});

// Auth sessions table for managing user logins
export const sessions = pgTable("session", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
}, (table) => ({
    userIdIdx: index("session_user_id_idx").on(table.userId),
}));

// Stores OAuth accounts (Google, GitHub, etc.) if you add them later
export const accounts = pgTable("accounts", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    ...timestamps,
}, (table) => ({
    accountUnique: uniqueIndex("account_provider_account_unique").on(table.providerId, table.accountId)
}));

// Verification table for Email verification and Password resets
export const verification = pgTable("verification", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    // Link to user if they are already registered (e.g. password reset)
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    identifier: text("identifier").notNull(), // Email address
    value: text("value").notNull(), // Hashed token
    expiresAt: timestamp("expires_at").notNull(),
    ...timestamps,
}, (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
    verificationUserIdx: index("verification_user_id_idx").on(table.userId),
}));

export const userRelations = relations(users, ({many})=>({
    posts: many(posts),
    donationSent: many(donations, {relationName: "donator"}),
    donationsReceived: many(donations, {relationName: "receiver"}),
    comments: many(comments),
    socials: many(socials),
    followers: many(follows, {relationName: "following"}), // people following the authenticated user
    following: many(follows, {relationName: "follower"}) // people this user follows
}));

export const sessionRelations = relations(sessions, ({one})=>({
    user: one(users, {fields: [sessions.userId], references:[users.id]})
}));