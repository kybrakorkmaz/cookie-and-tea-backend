import { db } from "../db/client.js";
import { posts } from "../db/schema/index.js";
import { and, eq } from "drizzle-orm";

export const getPostById = async (postId) =>{
    return db.select({
        postId: posts.id,
        userId: posts.userId
    }).from(posts)
        .where(eq(posts.id, postId));
}
export const updatePostById = async (userId, postId, updateData) => {
    return db.update(posts)
        .set({...updateData, updatedAt: new Date()})
        .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
        .returning();
};

export const deletePostById = async (userId, postId) => {
    const result = await db.delete(posts)
        .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
        .returning();
    return result[0] || null;
};

