import { db } from "../db/client.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";

export const fetchUserInfo = async (userId) => {
    return db.select({
        username: users.username,
        name: users.name,
        email: users.email
    }).from(users)
        .where(eq(users.id, userId));
};

export const updateUserSettings = async (userId, updateData) => {
    return db.update(users)
        .set(updateData) // Drizzle automatically updates ONLY the fields present in this object
        .where(eq(users.id, userId))
        .returning({
            username: users.username,
            name: users.name,
            email: users.email
        });
};