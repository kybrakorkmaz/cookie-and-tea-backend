import {users} from "../db/schema/index.js";
import {db} from "../db/client.js";
import {eq} from "drizzle-orm";
import {integer, text} from "drizzle-orm/pg-core";

const authPayload = {
    id: users.id,
    name: users.name,
    username: users.username,
    email: users.email,
    hashedPassword: users.hashedPassword,
    status: users.status,
    profileImage: users.profileImage,
    backgroundImage: users.backgroundImage,
    about: users.about
}
export const findUserByEmail = async (email) => {
    const rows = await db.select(authPayload)
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    return rows[0] || null;
}
export const findUserById = async (id) => {
    const rows = await db.select(authPayload)
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
    return rows[0] || null;
};

export const findUserByUsername = async (username) => {
    const rows = await db.select(authPayload)
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