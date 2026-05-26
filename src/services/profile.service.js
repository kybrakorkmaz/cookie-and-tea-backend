import {findUserByUsername} from "../repositories/auth.repository.js";
import {
    findSocialsByUserId,
    getUserEarningsById,
    latestTwoFollowers, latestTwoFollowing,
    topSupportedTwoPosts
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
    const user = await findUserByUsername(username);
    if (!user) {
        const error = new Error(`User account for '${username}' does not exist`);
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
        socials: socialsList,
        earningsTotal: earningData.total,
        topSupportedPosts: topPosts,
        recentConnections: connectionProfiles
    }
}

