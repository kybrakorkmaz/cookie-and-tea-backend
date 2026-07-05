import { db } from "../db/client.js";
import { follows, posts, users } from "../db/schema/index.js";
import { desc, eq, inArray, or } from "drizzle-orm";

// Feed Page: Authorized user posts + posts of people that user follows with strict pagination controls
export const getFeedTimelineFromDB = async (userId, limit = 5, offset = 0) => {
    const followedUserIds = db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));

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
        .where(or(eq(posts.userId, userId), inArray(posts.userId, followedUserIds)))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
};

export const createNewPost = async (postData) => {
    const [result] = await db.insert(posts).values(postData).returning();
    return result;
};

export const getFeedPostIds = async (userId) => {
    const following = db.select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));

    return db.select({postId: posts.id})
        .from(posts)
        .where(or(eq(posts.userId, userId), inArray(posts.userId, following)));
};