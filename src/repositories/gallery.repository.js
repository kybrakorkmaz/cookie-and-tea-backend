import {db} from "../db/client.js";
import {posts} from "../db/schema/index.js";
import {and, eq, inArray} from "drizzle-orm";

export const fetchImagesForUserPosts = async (userId) =>{
    return db.select({
        id: posts.id,
        imageUrl: posts.images
    })
        .from(posts)
        .where(
            and(
                eq(posts.userId, userId),
                inArray(posts.type, ["image", "hybrid"])
            )
        );
};
