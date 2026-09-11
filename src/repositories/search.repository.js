import {db} from "../db/client.js";
import {users} from "../db/schema/index.js";
import {and, eq, ilike, or, sql} from "drizzle-orm";

// Escape Postgres LIKE wildcards so user input is matched literally
// (backslash is the default ESCAPE character in Postgres)
const escapeLikePattern = (value) =>
    value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");

export const searchUsersByNameOrUsername = async (query, limit) => {
    const pattern = `%${escapeLikePattern(query)}%`;

    return db.select({
        id: users.id,
        name: users.name,
        username: users.username,
        profileImage: users.profileImage,
    })
        .from(users)
        .where(
            and(
                eq(users.status, "active"),
                or(
                    ilike(users.name, pattern),
                    ilike(users.username, pattern)
                )
            )
        )
        // Prefix matches first, then alphabetical — feels most relevant for typeahead
        .orderBy(
            sql`CASE
                WHEN ${users.username} ILIKE ${escapeLikePattern(query) || ''} || '%' THEN 0
                WHEN ${users.name} ILIKE ${escapeLikePattern(query) || ''} || '%' THEN 1
                ELSE 2
            END`,
            users.name
        )
        .limit(limit);
};
