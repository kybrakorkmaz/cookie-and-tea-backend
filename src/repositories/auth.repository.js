import {users} from "../db/schema/index.js";
import {db} from "../db/client.js";
import {eq} from "drizzle-orm";
import {integer, text} from "drizzle-orm/pg-core";

export const findUserByUsername = async (username) => {
    const rows = await db.select({
        id: users.id,
        name: users.name,
        username: users.username,
        profileImage: users.profileImage,
        backgroundImage: users.backgroundImage,
        about: users.about
    })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

    return rows[0] || null;
};

export const changeAboutByUsername = async (username, about) =>{
    const updatedRows = await db.update(users)
        .set({ about: about })
        .where(eq(users.username, username))
        .returning({ about: users.about });

    return updatedRows[0] || null;
}

export const createNewUser = async (name, username, email, password) => {
    return db.insert(users)
        .values({
            name: name,
            username: username,
            email: email,
            hashedPassword: password
        }).returning();
}

export const updateUserStatus = async (userId, newStatus) => {
    const updatedRows = await db.update(users)
        .set({ status: newStatus})
        .where(eq(users.id, userId))
        .returning();
    return updatedRows[0] || null;
}