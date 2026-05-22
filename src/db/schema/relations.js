import { relations } from "drizzle-orm";
import { users, sessions, accounts, verification } from "./auth.js";
import { posts, donations, comments } from "./posts.js";
import { socials, follows, conversations, messages } from "./profile.js";

export const userRelations = relations(users, ({ many }) => ({
    posts: many(posts),
    donationSent: many(donations, { relationName: "donator" }),
    donationsReceived: many(donations, { relationName: "receiver" }),
    comments: many(comments),
    socials: many(socials),
    followers: many(follows, { relationName: "following" }),
    following: many(follows, { relationName: "follower" })
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
    author: one(users, { fields: [posts.userId], references: [users.id] }),
    donations: many(donations),
    comments: many(comments)
}));

export const donationRelations = relations(donations, ({ one }) => ({
    post: one(posts, { fields: [donations.postId], references: [posts.id] }),
    donator: one(users, { fields: [donations.donatorId], references: [users.id], relationName: "donator" }),
    receiver: one(users, { fields: [donations.receiverId], references: [users.id], relationName: "receiver" })
}));

export const commentsRelations = relations(comments, ({ one }) => ({
    post: one(posts, { fields: [comments.postId], references: [posts.id] }),
    commenter: one(users, { fields: [comments.commenterId], references: [users.id] })
}));

export const socialRelations = relations(socials, ({ one }) => ({
    user: one(users, { fields: [socials.userId], references: [users.id] })
}));

export const followsRelations = relations(follows, ({ one }) => ({
    follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "follower" }),
    following: one(users, { fields: [follows.followingId], references: [users.id], relationName: "following" }),
}));

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
    messages: many(messages),
    userOne: one(users, {
        fields: [conversations.userOneId],
        references: [users.id],
        relationName: "chatParticipantOne"
    }),
    userTwo: one(users, {
        fields: [conversations.userTwoId],
        references: [users.id],
        relationName: "chatParticipantTwo"
    }),
}));

export const messageRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
    sender: one(users, { fields: [messages.senderId], references: [users.id] })
}));
