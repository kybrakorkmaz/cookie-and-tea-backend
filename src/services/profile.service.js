// profile service
import {changeAboutByUsername} from "../repositories/auth.repository.js";
import {
    findSocialsByUserId,
    getUserEarningsById,
    latestTwoFollowers,
    latestTwoFollowing,
    topSupportedTwoPosts, updateSocialMediaById,
    getImagesByUserId, getProfilePosts, getAllProfilePostIds,
} from "../repositories/profile.repository.js";

import {fetchAllCommentsForIds, fetchPrevCommentsForIds} from "./comment.service.js";

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
export const getGalleryByUserId = async (user, page = 1, limit = 20) => {
    // Fetch posts which contain images
    const rawPostsMedia = await getImagesByUserId(user.id);

    // Flatten into an array of { postId, imageUrl } while preserving post linkage
    const flattened = (rawPostsMedia || []).flatMap(post => {
        const images = post.imageUrl || [];
        return images.map(url => ({ postId: post.id, imageUrl: url }));
    });

    // Pagination guards and defaults
    const p = Number.isNaN(Number(page)) ? 1 : Math.max(1, parseInt(page, 10));
    const l = Number.isNaN(Number(limit)) ? 20 : Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const paged = flattened.slice(offset, offset + l);

    return {
        userId: user.id,
        images: paged,
        meta: {
            total: flattened.length,
            page: p,
            limit: l
        }
    };
};

export const findProfilePosts = async (userId) =>{
    const userPosts= await getProfilePosts(userId);
    if (!userPosts || userPosts.length <= 0) {
        return [];
    }
    // Map database properties directly to frontend component layout values
    return userPosts;
}

export const findProfilePrevComments = async (userId) => {
    // Get IDs from your posts repository
    const allPostIds = await getAllProfilePostIds(userId);
    if (!allPostIds || allPostIds.length === 0) return [];

    // Fetch comments using the repo
    return await fetchPrevCommentsForIds(allPostIds);
};

export const findAllProfileComments = async (userId) =>{
    const allPostIds = await getAllProfilePostIds(userId);
    if (!allPostIds || allPostIds.length === 0) return [];

    return await fetchAllCommentsForIds(allPostIds);
}