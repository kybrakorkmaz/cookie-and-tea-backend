// profile service
import {changeAboutByUsername} from "../repositories/auth.repository.js";
import {
    findSocialsByUserId,
    getUserEarningsById,
    latestTwoFollowers,
    latestTwoFollowing,
    topSupportedTwoPosts, updateSocialMediaById,
    getImagesByUserId, getProfilePosts, getAllProfilePostIds,
    findFollowRelationship,
    insertFollow,
    removeFollow,
} from "../repositories/profile.repository.js";

import {fetchPrevCommentsForIds} from "./comment.service.js";
import { notifyFollow } from "./actions.service.js";

export const getPanelInfo = async (user) =>{
    // required header properties
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage,
        backgroundImage: user.backgroundImage
    };
};

export const getIntroDashboard = async (user, timelineDays, isFollowerView) =>{
    // Execute unrelated DB tasks concurrently in parallel routines
    const [socialsList, earningData, topPosts] = await Promise.all([
        findSocialsByUserId(user.id),
        getUserEarningsById(user.id, timelineDays),
        topSupportedTwoPosts(user.id)
    ]);

    // Handle truthy string or boolean evaluations coming down from Zod's parse pipeline
    const shouldFetchFollowers = isFollowerView === true || isFollowerView === "true";

    const connectionProfiles = shouldFetchFollowers
        ? await latestTwoFollowers(user.id)
        : await latestTwoFollowing(user.id);

    return{
        about: user.about || "",
        socials: socialsList || [],
        earningsTotal: earningData.total ?? 0,
        topSupportedPosts: topPosts || [],
        recentConnections: connectionProfiles || []
    }
}
export const earnedMoney = async (user, timeline) =>{
    return await getUserEarningsById(user.id, timeline);
}

export const getUserAboutInfo = async (user) => {
    return user.about ?? "This person is so lazy to introduce themselves.";
}

export const changeAbout = async (user, about) =>{
    // Check for explicit undefined or null payloads
    if (about === undefined) {
        const error = new Error("Invalid payload: 'about' text property is missing");
        error.statusCode = 400;
        throw error;
    }

    // Short-circuit if new data matches exactly what's currently in the DB
    if(user.about === about){
        const error = new Error(`Nothing changed`);
        error.statusCode = 400;
        error.code = 'NO_OP';
        throw error;
    }

    // Process and save changes via the Data Access Layer
    const result = await changeAboutByUsername(user.username, about);
    if (!result) {
        const error = new Error("Database transaction failed to execute update sequence");
        error.statusCode = 500;
        throw error;
    }

    return result; // Returns object { about: "..." } back up to controller scope
}
export const updateSocialMediaList = async (user, socials) =>{
    return await updateSocialMediaById(user.id, socials);
}
export const findTwoFollowing = async (user, isFollow) =>{
    if(isFollow) return []; // Explicitly return empty array payload instead of breaking flow

    const  response = await  latestTwoFollowing(user.id)

    if(!response || response.length <=0){
        const error = new Error(`No one is followed.`);
        error.statusCode = 400;
        error.code = 'NO_OP';
        throw error;
    }

    return response;
}

export const getTwoFollowers = async (user) =>{
    const response = await latestTwoFollowers(user.id);

    if(!response || response.length <=0){
        const error = new Error("No followers found.");
        error.statusCode = 400;
        error.code = 'NO_OP';
        throw error;
    }

    return response;
}
export const getGalleryByUserId = async (user) => {
    // Fetch media records
    const rawPostsMedia = await getImagesByUserId(user.id);

    // Flatten array objects cleanly for client consumption
    const flattenedImages = (rawPostsMedia || []).flatMap(post => post.imageUrl || []);

    return {
        userId: user.id,
        images: flattenedImages
    };
};

export const findProfilePosts = async (userId) =>{
    const userPosts= await getProfilePosts(userId);
    if (!userPosts || userPosts.length <= 0) {
        return [];
    }

    // Fetch preview comments (up to 2 per post) and attach
    const postIds = userPosts.map(p => p.id);
    const rawComments = await fetchPrevCommentsForIds(postIds, 1, postIds.length * 2);

    const commentsByPost = (rawComments || []).reduce((acc, c) => {
        const pid = c.postId || c.post_id || c.postId;
        if (!pid) return acc;
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(c);
        return acc;
    }, {});

    return userPosts.map(post => ({
        ...post,
        previewComments: (commentsByPost[post.id] || []).slice(0,2)
    }));
}

export const findProfilePrevComments = async (userId, page = 1, limit = 20) => {
    // Get IDs from your posts repository
    const allPostIds = await getAllProfilePostIds(userId);
    if (!allPostIds || allPostIds.length === 0) return [];

    // Fetch comments using the repo
    return await fetchPrevCommentsForIds(allPostIds, page, limit);
};

export const followUser = async (follower, targetUser) => {
    if (follower.id === targetUser.id) {
        const error = new Error("You cannot follow yourself");
        error.statusCode = 400;
        throw error;
    }

    const existing = await findFollowRelationship(follower.id, targetUser.id);
    if (existing.length > 0) {
        const error = new Error("Already following this user");
        error.statusCode = 400;
        throw error;
    }

    const follow = await insertFollow(follower.id, targetUser.id);

    await notifyFollow({
        actorId: follower.id,
        targetUserId: targetUser.id,
    });

    return follow;
};

export const unfollowUser = async (follower, targetUser) => {
    const deleted = await removeFollow(follower.id, targetUser.id);

    if (!deleted.length) {
        const error = new Error("Follow relationship not found");
        error.statusCode = 404;
        throw error;
    }

    return deleted[0];
};
