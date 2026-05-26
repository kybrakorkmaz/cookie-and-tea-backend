import {users} from "../db/schema/index.js";
import {db} from "../db/client.js";
import {eq} from "drizzle-orm";

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