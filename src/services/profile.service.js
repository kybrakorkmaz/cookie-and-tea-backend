import {changeAboutByUsername, findUserByUsername} from "../repositories/auth.repository.js";
import {
    findSocialsByUserId,
    getUserEarningsById,
    latestTwoFollowers,
    latestTwoFollowing,
    topSupportedTwoPosts, updateSocialMediaById,
    getImagesByUserId,
} from "../repositories/profile.repository.js";

export const getPanelInfo = async (username) =>{
    const user = await findUserByUsername(username);
    if(!user){
        const error = new Error(`User profile for '${username}' was not found`);
        error.statusCode = 404;
        throw error;
    }

    // required header properties
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage,
        backgroundImage: user.backgroundImage
    };
};

export const getIntroDashboard = async (username, timelineDays, isFollowerView) =>{
    // Must pull the actual user profile info to safely read `about` fields
    const user = await findUserByUsername(username);
    if (!user) {
        const error = new Error(`User profile for '${username}' was not found`);
        error.statusCode = 404;
        throw error;
    }

    // Execute unrelated DB tasks concurrently in parallel routines
    const [socialsList, earningData, topPosts] = await Promise.all([
        findSocialsByUserId(user.id),
        getUserEarningsById(user.id, timelineDays),
        topSupportedTwoPosts(user.id)
    ]);

    const connectionProfiles = isFollowerView
        ? await latestTwoFollowers(user.id)
        : await latestTwoFollowing(user.id);

    return{
        about: user.about || "",
        socials: socialsList || [], // Ensure it matches frontend layout arrays fallback
        earningsTotal: earningData.total,
        topSupportedPosts: topPosts,
        recentConnections: connectionProfiles
    }
}
export const earnedMoney = async (username, timeline) =>{
    const user = await findUserByUsername(username);
    if(!user){
        const error = new Error(`User profile for '${username}' was not found`);
        error.statusCode = 404;
        throw error;
    }

    return await getUserEarningsById(user.id, timeline);
}

export const getUserAboutInfo = async (username) => {
    const user = await findUserByUsername(username);

    // Service catches data absence and sets the standard semantic metadata
    if (!user) {
        const error = new Error(`User profile for '${username}' was not found`);
        error.statusCode = 404;
        throw error;
    }

    return user.about ?? "This person is so lazy to introduce themselves.";
}

export const changeAbout = async (username, about) =>{
    const user = await findUserByUsername(username);
    if(!user){
        const error = new Error(`User profile for '${username}' was not found`);
        error.statusCode = 404;
        throw error;
    }
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
    const result = await changeAboutByUsername(username, about);
    if (!result) {
        const error = new Error("Database transaction failed to execute update sequence");
        error.statusCode = 500;
        throw error;
    }

    return result; // Returns object { about: "..." } back up to controller scope
}
export const updateSocialMediaList = async (username, socials) =>{
    const user = await findUserByUsername(username);
    if(!user){
        const error = new Error(`User profile for '${username}' was not found`);
        error.statusCode = 404;
        throw error;
    }

    return await updateSocialMediaById(user.id, socials);
}
export const findTwoFollowing = async (username, isFollow) =>{
    const user = await findUserByUsername(username);
    if(isFollow)    return; // false is following
    if(!user){
        const error = new Error(`User profile for '${username}' was not found`);
        error.statusCode = 404;
        throw error;
    }
    const  response = await  latestTwoFollowing(user.id)

    if(!response || response.length <=0){
        const error = new Error(`No one is followed.`);
        error.statusCode =  304; // 304 Not Modified standard REST status code
        throw error;
    }

    return response;
}

export const getTwoFollowers = async (username) =>{
    const user = await findUserByUsername(username);
    if(!user){
        const error = new Error(`User profile for '${username}' was not found`);
        error.statusCode = 404;
        throw error;
    }

    const response = await latestTwoFollowers(user.id);

    if(!response || response.length <=0){
        const error = new Error(`No one is followed.`);
        error.statusCode = 400;
        error.code = 'NO_OP';
        throw error;
    }

    return response;
}
export const getGalleryByUserId = async (username) => {
    // 1. Resolve username to user record
    const user = await findUserByUsername(username);
    if (!user) {
        const error = new Error(`User profile for '${username}' was not found`);
        error.statusCode = 404;
        throw error;
    }

    // 2. Fetch media records
    const rawPostsMedia = await getImagesByUserId(user.id);

    // 3. Flatten array objects cleanly for client consumption
    const flattenedImages = rawPostsMedia.flatMap(post => post.imageUrl || []);

    return {
        userId: user.id,
        images: flattenedImages
    };
};



