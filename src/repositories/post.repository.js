import {follows, posts, users} from "../db/schema/index.js";
import {and, desc, eq, inArray, or} from "drizzle-orm";
import {db} from "../db/client.js";

// Feed Page: Authorized user posts + posts of people that user follows
export const getFeedTimelineFromDB = async (userId) =>{
    // Find IDs of users that the current user follows
    const followedUserIds = db
        .select({id: follows.followingId})
        .from(follows)
        .where(eq(follows.followerId, userId)); // Fix: followerId

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
        ).orderBy(desc(posts.createdAt));
}

// Profile page: Authorized user's posts
export const getAllUserPostsFromDB = async (userId) =>  {
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
        .where(eq(posts.userId, userId))
        .orderBy(desc(posts.createdAt));
}
// Verifies if a post belongs to a user
export const findPostByIds = async (userId, postId) =>{
    const result = await db.select({
        userId: posts.userId,
        postId: posts.id
    })
        .from(posts)
        .where(and(eq(posts.userId, userId), eq(posts.id, postId)));

    return result[0];
}

export const createNewPost = async (postData) =>{
    const result = await db.insert(posts).values(postData).returning();
    return result[0];
}

export const updatePostByIds = async (userId, postId, newData) =>{
    return db.update(posts)
        .set({ ...newData, updatedAt: new Date() })
        .where(
            and(
                eq(posts.userId, userId),
                eq(posts.id, postId)
            )
        ).returning({ postId: posts.id });
}

export const deletePostByIds = async (userId, postId) => {
    return db.delete(posts)
        .where(
            and(
                eq(posts.userId, userId),
                eq(posts.id, postId)
            )
        ).returning({ postId: posts.id });
};