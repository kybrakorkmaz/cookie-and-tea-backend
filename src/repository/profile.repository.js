import {db} from "../db/client.js";
import {users, socials, posts, follows} from "../db/schema/index.js";
import {and, desc, eq, gte, sql} from "drizzle-orm";

export const getUserAboutById = async (userId) =>{
    const about = await db.select({
        about:users.about
    }).from(users).where(eq(users.id, userId));

    return about[0] || null;
}

export const findSocialsByUserId = async (userId) => {
    return db.select({
        id: socials.id,
        platform: socials.socialMedia,
        url: socials.socialUrl
    })
        .from(socials)
        .where(eq(socials.userId, userId)) || null;
};

export const getUserEarningsById = async (userId, dayLimit) =>{
    // calculating the sum filtered by a date boundary condition
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate()-dayLimit);

    const earnings = await db.select({
        total: sql`COALESCE(SUM(${posts.donationSum}), 0)`.mapWith(Number),
    }).from(posts)
        .where(
            and(
                eq(posts.userId, userId),
                gte(posts.createdAt, dateThreshold)
            )
        );

    return earnings[0] || {total: 0};
}

export const topSupportedTwoPosts = async (userId) =>{
    return db.select({
        postId:posts.id,
        header: posts.header,
        type: posts.type,
        content: posts.content,
        //date:posts.date
    }).from(posts)
        .where(eq(posts.userId, userId))
        .orderBy(desc(posts.createdAt) && desc(posts.donationSum))
        .limit(2)
}

export const latestTwoFollowers = async (userId)=>{
    return db.select({
        id: users.id,
        name: users.name,
        username: users.username,
        profileImage: users.profileImage
    })
        .from(follows)
        .innerJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, userId))
        .orderBy(desc(follows.createdAt))
        .limit(2);
}

export const latestTwoFollowing = async (userId) =>{
    return db.select({
        id: users.id,
        name: users.name,
        username: users.username,
        profileImage: users.profileImage
    }).from(follows)
        .innerJoin(users, eq(users.id, follows.followingId))
        .where(eq(users.id, follows.followerId))
        .orderBy(desc(follows.createdAt))
        .limit(2)
}