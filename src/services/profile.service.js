// profile service
import {changeAboutByUsername, updateUserImagesById} from "../repositories/auth.repository.js";
import {
    findSocialsByUserId,
    getUserEarningsById,
    latestTwoFollowers,
    latestTwoFollowing,
    topSupportedTwoPosts, updateSocialMediaById,
    getImagesByUserId, getProfilePosts, countProfilePosts, getAllProfilePostIds,
    findFollowRelationship,
    insertFollow,
    removeFollow,
    findFollowersByUserId,
    findFollowingByUserId,
    countFollowersByUserId,
    countFollowingByUserId,
    findFollowingIdsAmong,
} from "../repositories/profile.repository.js";

import {attachPreviewComments, fetchPrevCommentsForIds} from "./comment.service.js";
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

export const getIntroDashboard = async (user, timelineDays, isFollowerView, viewerId) =>{
    const isOwner = viewerId === user.id;

    // Execute unrelated DB tasks concurrently in parallel routines
    const [socialsList, earningData, topPosts] = await Promise.all([
        findSocialsByUserId(user.id),
        isOwner ? getUserEarningsById(user.id, timelineDays) : Promise.resolve(null),
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
        ...(isOwner ? { earningsTotal: earningData.total ?? 0 } : {}),
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

const saveUserImage = async (userId, imageFields) => {
    const result = await updateUserImagesById(userId, imageFields);
    if (!result) {
        const error = new Error("Database transaction failed to execute update sequence");
        error.statusCode = 500;
        throw error;
    }
    return result;
}

export const changeProfileImage = async (user, imageUrl) => {
    return saveUserImage(user.id, { profileImage: imageUrl });
}

export const changeCoverImage = async (user, imageUrl) => {
    return saveUserImage(user.id, { backgroundImage: imageUrl });
}
export const findTwoFollowing = async (user, isFollow) =>{
    if(isFollow) return [];

    return await latestTwoFollowing(user.id) || [];
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

export const findProfilePosts = async (userId, limit, offset) =>{
    const [userPosts, total] = await Promise.all([
        getProfilePosts(userId, limit, offset),
        countProfilePosts(userId),
    ]);
    if (!userPosts || userPosts.length <= 0) {
        return { posts: [], total };
    }

    const postIds = userPosts.map(p => p.id);
    const rawComments = await fetchPrevCommentsForIds(postIds);
    return { posts: attachPreviewComments(userPosts, rawComments), total };
}

export const findProfilePrevComments = async (userId) => {
    const allPostIds = await getAllProfilePostIds(userId);
    if (!allPostIds || allPostIds.length === 0) return [];

    return await fetchPrevCommentsForIds(allPostIds);
};

const mapPeopleWithFollowState = async (people, viewerId) => {
    const candidateIds = (people ?? [])
        .map((person) => person.id)
        .filter((id) => id !== viewerId);
    const followingSet = new Set(await findFollowingIdsAmong(viewerId, candidateIds));
    return (people ?? []).map((person) => ({
        ...person,
        isFollowing: person.id !== viewerId && followingSet.has(person.id),
    }));
};

export const getFollowersForUser = async (profileUser, viewerId, limit, offset) => {
    const [people, total] = await Promise.all([
        findFollowersByUserId(profileUser.id, limit, offset),
        countFollowersByUserId(profileUser.id),
    ]);
    return { people: await mapPeopleWithFollowState(people, viewerId), total };
};

export const getFollowingForUser = async (profileUser, viewerId, limit, offset) => {
    const [people, total] = await Promise.all([
        findFollowingByUserId(profileUser.id, limit, offset),
        countFollowingByUserId(profileUser.id),
    ]);
    return { people: await mapPeopleWithFollowState(people, viewerId), total };
};

export const isFollowing = async (follower, targetUser) =>{
    const isFollow = await findFollowRelationship(follower.id, targetUser.id);
    return isFollow.length > 0;

}
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

    // Isolate notification pipeline inside a try-catch to keep the layer resilient
    try {
        await notifyFollow({
            actorId: follower.id,
            targetUserId: targetUser.id,
        });
    } catch (notificationError) {
        console.error(`Best-effort notification failed for follower ${follower.id} targeting ${targetUser.id}:`, notificationError);
    }

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