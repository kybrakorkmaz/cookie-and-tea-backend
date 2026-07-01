import {db} from "../db/client.js";
import {comments, posts, users} from "../db/schema/index.js";
import {and, desc, eq, inArray, sql} from "drizzle-orm";

export const findPrevComments = async (allPostIds, page = 1, limit = 20) => {

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
        .where(inArray(comments.postId, allPostIds))
        .as("ranked");

    const p = Number.isNaN(Number(page)) ? 1 : Math.max(1, parseInt(page, 10));
    const l = Number.isNaN(Number(limit)) ? 20 : Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (p - 1) * l;

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
        .where(sql`${rankedComments.rn}
        <= 2`)
        .orderBy(desc(rankedComments.createdAt))
        .limit(l)
        .offset(offset);
};

export const findAllComments = async (postIds, page = 1, limit = 20) =>{
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
        .where(inArray(comments.postId, postIds))
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

export const updateComment = async (commentId, comment) =>{
    return db
        .update(comments)
        .set({
            comment: comment
        }).where(and(
            eq(comments.id, commentId)
        )).returning();
}

export const deleteComment  = async (commentId) =>{
    return db
        .delete(comments)
        .where(eq(comments.id, commentId))
        .returning();
}