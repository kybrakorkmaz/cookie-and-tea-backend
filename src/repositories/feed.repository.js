import {db} from "../db/client.js";
import {follows, posts, users} from "../db/schema/index.js";
import {and, desc, eq, inArray, or} from "drizzle-orm";

// Feed Page: Authorized user posts + posts of people that user follows with strict pagination controls
export const getFeedTimelineFromDB = async (userId, limit = 5, offset = 0) => {
    // Find IDs of users that the current user follows
    const followedUserIds = db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));

    // Fetch posts with author metadata attached
    return db
        .select({
            id: posts.id,
            userId: posts.userId,
            type: posts.type,
            header: posts.header,
            content: posts.content,
            images: posts.images,
            videos: posts.videos,
            commentCount: posts.commentCount,
            donationSum: posts.donationSum,
            createdAt: posts.createdAt,
            authorName: users.name,
            authorUsername: users.username,
            authorProfileImage: users.profileImage
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(
            or(
                eq(posts.userId, userId),
                inArray(posts.userId, followedUserIds)
            )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
};


export const createNewPost = async (postData) => {
    const result = await db.insert(posts).values(postData).returning();
    return result[0];
};

export const findPostById = async (id) => {
    const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return result[0];
};

export const updatePostById = async (userId, postId, updateData) => {
    return db.update(posts)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
        .returning();
};

export const deletePostById = async (userId, id) => {
    const result = await db.delete(posts)
        .where(and(eq(posts.id, id), eq(posts.userId, userId)))
        .returning();
    return result[0];
};
