import {db} from "../db/client.js";
import {comments, posts, users} from "../db/schema/index.js";
import {desc, eq, inArray, sql} from "drizzle-orm";

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

export const findPrevComments = async (allPostIds) => {
    if (!allPostIds || allPostIds.length === 0) return [];

    // Normalize IDs to an array of numbers
    const ids = allPostIds.map(p => typeof p === "object" ? p.postId : p);

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
            comment: rankedComments.comment,
            authorName: users.name,
            authorUsername: users.username,
            authorProfileImage: users.profileImage
        })
        .from(rankedComments)
        .innerJoin(users, eq(users.id, rankedComments.commenterId))
        .where(sql`${rankedComments.rn}
        <= 2`)
        .orderBy(desc(rankedComments.createdAt));
};