import { timestamp } from "drizzle-orm/pg-core";

// Reusable timestamps to track record lifecycle
export const timestamps = () => ({
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

// For immutable actions or join tables (Follows, Likes, Log history)
export const actionTimestamp = () => ({
    createdAt: timestamp("created_at").defaultNow().notNull(),
});