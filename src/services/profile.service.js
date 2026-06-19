import {changeAboutByUsername} from "../repositories/auth.repository.js";
import {
    findSocialsByUserId,
    getUserEarningsById,
    latestTwoFollowers,
    latestTwoFollowing,
    topSupportedTwoPosts, updateSocialMediaById,
    getImagesByUserId,
} from "../repositories/profile.repository.js";
import {
    deletePostByIds,
    findPostByIds,
    getAllUserPostsFromDB,
    updatePostByIds
} from "../repositories/post.repository.js";

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

export const findUserPosts = async (user) =>{
    const databasePosts = await getAllUserPostsFromDB(user.id);

    if (!databasePosts || databasePosts.length <= 0) {
        const error = new Error("No post found!");
        error.statusCode = 204;
        throw error;
    }

    // Map database properties directly to frontend component layout values
    return databasePosts.map(post => ({
        post_id: post.id,
        user_id: post.userId,
        post_type: post.type,
        post_header: post.header,
        post_detail: post.content,
        post_image: post.images || [],
        post_video: post.videos || [],
        comment_count: post.commentCount || 0,
        donation_sum: post.donationSum || 0,
        post_date: post.createdAt ? new Date(post.createdAt): "",
        user: {
            name: post.authorName,
            username: post.authorUsername,
            profileImage: post.authorProfileImage
        }
    }));
}

export const updatePost = async (userId, postId, newData) =>{
    const isAuthorized = await findPostByIds(userId, postId);
    if(!isAuthorized){
        const error = new Error("Unauthorized request!");
        error.statusCode = 401;
        throw error;
    }
    const updatedPost = await updatePostByIds(userId, postId, newData);

    if(!updatedPost){
        const error = new Error("post couldn't be updated, try later!");
        error.statusCode = 500;
        throw error;
    }

    return updatedPost;
}


export const deletePost = async (userId, postId) =>{
    const isAuthorized = await findPostByIds(userId, postId);
    if(!isAuthorized){
        const error = new Error("Unauthorized request!");
        error.statusCode = 401;
        throw error;
    }

    const deletedPost = await deletePostByIds(userId, postId);

    if(!deletedPost){
        const error = new Error("post couldn't be deleted, try later!");
        error.statusCode = 500;
        throw error;
    }

    return deletedPost;
}

