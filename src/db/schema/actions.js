import {integer, pgEnum, pgTable, text, timestamp, index} from "drizzle-orm/pg-core";
import {users} from "./auth.js";
import {posts} from "./posts.js";

export const actionTypeEnum = pgEnum("action_type", ["comment", "follow", "donation"]);
export const actionStatusEnum = pgEnum("action_status", ["unread", "read"]);

export const actions = pgTable("actions", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    actorId: integer("actor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    targetUserId: integer("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: actionTypeEnum("type").notNull(),
    postId: integer("post_id").references(() => posts.id, { onDelete: "set null" }),
    amount: integer("amount"),
    message: text("message"),
    status: actionStatusEnum("status").default("unread").notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
    targetCreatedIdx: index("actions_target_created_idx").on(table.targetUserId, table.createdAt.desc())
}));
