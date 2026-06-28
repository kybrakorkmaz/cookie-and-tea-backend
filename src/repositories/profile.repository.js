import {db} from "../db/client.js";
import {follows, posts, socials, users} from "../db/schema/index.js";
import {and, desc, eq, gte, inArray, sql} from "drizzle-orm";

export const findSocialsByUserId = async (userId) => {
    return db.select({
        id: socials.id,
        socialMedia: socials.socialMedia,
        socialUrl: socials.socialUrl
    })
        .from(socials)
        .where(eq(socials.userId, userId));
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
        commentCount: posts.commentCount,
        donationSum: posts.donationSum,
        date:posts.createdAt
    }).from(posts)
        .where(eq(posts.userId, userId))
        .orderBy(desc(posts.donationSum), desc(posts.createdAt))
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
        .where(eq(follows.followerId, userId))
        .orderBy(desc(follows.createdAt))
        .limit(2)
}
export const updateSocialMediaById = async (userId, socialsList) => {
    // Full transaction loop wiping old records and bulk-inserting new array lists
    return db.transaction(async (tx) => {
        // 1. Delete all existing social links for this specific profile ID
        await tx.delete(socials).where(eq(socials.userId, userId));

        // 2. Short-circuit if user cleared out all links
        if (!socialsList || socialsList.length === 0) {
            return [];
        }

        // 3. Map parameters to match database schema columns accurately
        const recordsToInsert = socialsList.map(item => ({
            userId: userId,
            socialMedia: item.socialMedia,
            socialUrl: item.socialUrl
        }));

        // 4. Bulk insert records and return rows mapped to keys matching your GET query expectations
        return tx.insert(socials)
            .values(recordsToInsert)
            .returning({
                id: socials.id,
                socialMedia: socials.socialMedia,
                socialUrl: socials.socialUrl
            });
    });
};
export const getImagesByUserId = async (userId) =>{
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
}

// Profile page: Authorized user's posts
export const getProfilePosts = async (userId) =>  {
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



export const getAllProfilePostIds = async (userId) =>{
    return db.select({
        postId:posts.id
    }).from(posts)
        .where(eq(posts.userId, userId))
}

