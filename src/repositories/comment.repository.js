import {db} from "../db/client.js";
import {comments, posts, users} from "../db/schema/index.js";
import {and, desc, eq, inArray, sql} from "drizzle-orm";

export const findPrevComments = async (postIds) => {
    // Normalize incoming identifiers to an array of primitive numbers
    const ids = Array.isArray(postIds)
        ? postIds
            .map(p => (typeof p === 'object' && p !== null ? p.postId ?? p.post_id ?? p.id : p))
            .map(Number)
            .filter(n => !Number.isNaN(n))
        : [];

    if (!ids || ids.length === 0) return [];

    const rankedComments = db
        .select({
            id: comments.id,
            postId: comments.postId,
            comment: comments.comment,
            commenterId: comments.commenterId,
            createdAt: comments.createdAt,
            rn: sql`row_number() over (partition by ${comments.postId} order by ${comments.createdAt} desc)`.as("rn")
        })
        .from(comments)
        .where(inArray(comments.postId, ids))
        .as("ranked");

    return db
        .select({
            postId: rankedComments.postId,
            commentId: rankedComments.id,
            comment: rankedComments.comment,
            authorName: users.name,
            authorUsername: users.username,
            authorProfileImage: users.profileImage
        })
        .from(rankedComments)
        .innerJoin(users, eq(users.id, rankedComments.commenterId))
        .innerJoin(posts, eq(posts.id, rankedComments.postId))
        .where(sql`${rankedComments.rn} <= 2`)
        .orderBy(desc(posts.createdAt));
};

export const fetchAllComments = async (postId, page = 1, limit = 20) =>{
    const p = Number.isNaN(Number(page)) ? 1 : Math.max(1, parseInt(page, 10));
    const l = Number.isNaN(Number(limit)) ? 20 : Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    return db.select({
        commentId: comments.id,
        postId: comments.postId,
        comment: comments.comment,
        authorName: users.name,
        authorUsername: users.username,
        authorProfileImage: users.profileImage
    }).from(comments)
        .innerJoin(users, eq(users.id, comments.commenterId))
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt))
        .limit(l)
        .offset(offset);
}



export const createComment = async (userId, postId, comment) => {
    return await db.transaction(async (tx) => {
        // 1. Insert the comment
        const [newComment] = await tx.insert(comments)
            .values({ commenterId: userId, postId, comment })
            .returning();

        // 2. Increment the comment count on the post
        await tx.update(posts)
            .set({ commentCount: sql`${posts.commentCount} + 1` })
            .where(eq(posts.id, postId));

        return newComment;
    });
};

// Destructure input parameter and enforce commenterId isolation
export const updateComment = async ({ commentId, commenterId, comment }) =>{
    return db
        .update(comments)
        .set({
            comment: comment
        }).where(and(
            eq(comments.id, commentId),
            eq(comments.commenterId, commenterId)
        )).returning();
}

// Destructure input parameter and filter the deletion context by commenterId
export const deleteComment  = async ({ commentId, commenterId }) =>{
    return await db.transaction(async (tx) => {
        // Delete the comment row matching both primary key and owner identifier
        const deleted = await tx.delete(comments)
            .where(and(
                eq(comments.id, commentId),
                eq(comments.commenterId, commenterId)
            ))
            .returning();

        // If nothing was deleted (unauthorized or missing), early return safe empty array
        if (!deleted || deleted.length === 0) {
            return deleted;
        }

        // Decrement the comment count on the related post (guard against negative values)
        const postId = deleted[0].postId;
        await tx.update(posts)
            .set({ commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)` })
            .where(eq(posts.id, postId));

        return deleted;
    });
}