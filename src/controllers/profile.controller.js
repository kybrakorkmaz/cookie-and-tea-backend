// profile controller
import {
    changeAbout,
    earnedMoney,
    getIntroDashboard,
    getPanelInfo, findTwoFollowing,
    getUserAboutInfo, updateSocialMediaList, getGalleryByUserId, findProfilePosts, findProfilePrevComments,
    followUser,
    unfollowUser, isFollowing,
} from "../services/profile.service.js";

// Called ONCE when the profile page loads
export const getUserPanel = async (req, res, next) => {
    try {
        const user = req.resolvedUser; // The user whose profile is being visited
        const currentUserId = req.user.id; // The currently authenticated user

        const panelData = await getPanelInfo(user);

        // 1. Determine if it's the user's own profile
        const isOwnProfile = currentUserId === user.id;

        // 2. Check if the logged-in user follows the profile owner
        const following = isOwnProfile
            ? false
            : await isFollowing({ id: currentUserId }, user);

        return res.status(200).json({
            ...panelData,
            isFollowing: following,
            isOwnProfile: isOwnProfile
        });
    } catch (e) {
        next(e);
    }
};

// Called when viewing the Intro tab
export const getUserIntro = async (req, res, next) => {
    try {
        const user = req.resolvedUser;
        const { earningTimeline, isFollower } = req.query; // Filters remain in query

        const introData = await getIntroDashboard(user, earningTimeline, isFollower);
        return res.status(200).json(introData);
    } catch (e) {
        next(e);
    }
};

export const getUserEarnedMoney = async (req, res, next) =>{
    try{
        const user = req.resolvedUser;
        const {earningTimeline} = req.query; // Expects "30", "90", or "365"

        // Convert the string parameter safely to an integer
        const dayLimit = typeof earningTimeline === "number" ? earningTimeline : 30;
        // Process via business logic layer
        const earningsData = await earnedMoney(user, dayLimit);
        return res.status(200).json(earningsData);
    }catch (e){
        next(e); // Safe forwarding to your winston errorHandler
    }
}
export const getUserAbout = async (req,res,next) =>{
    try{
        const user = req.resolvedUser;

        // Controller blindly delegates to service layer
        const aboutText = await getUserAboutInfo(user);
        return res.status(200).json({
            about: aboutText
        });
    }catch (e){
        next(e); // Catch everything and push straight to your centralized Winston errorHandler
    }
}
export const setUserAbout = async (req,res,next) =>{
    try{
        // Enforcing authenticated session contexts or matching target route parameters
        const user = req.resolvedUser;

        if (req.user.id !== user.id) {
            const error = new Error("Unauthorized: You can only modify your own profile.");
            error.statusCode = 403;
            throw error;
        }

        const { about } = req.body; // Read incoming text data from the JSON body payload!

        // Controller passes data down, expecting the service throw errors if invalid
        const updatedProfile = await changeAbout(user, about);

        // Standard REST 200 OK Response passing structured state details back to frontend hooks
        return res.status(200).json({
            status: "success",
            about: updatedProfile.about
        });
    }catch (e){
        next(e);
    }
}
export const setSocialMedia = async (req, res, next) =>{
    try{
        const user = req.resolvedUser;

        if (req.user.id !== user.id) {
            const error = new Error("Unauthorized: You can only modify your own social links.");
            error.statusCode = 403;
            throw error;
        }

        const {socials} = req.body; // Array extracted via Zod body wrapper

        const updatedSocialsList = await updateSocialMediaList(user, socials);
        return res.status(200).json({
            status: "success",
            socials: updatedSocialsList
        });
    }catch (e){
        next(e);
    }
}
export const getTwoFollowing = async (req, res, next) =>{
    try {
        const user = req.resolvedUser;
        const { isFollower } = req.query;

        // Clean query boolean transformation mirroring your schema expectations
        const isFollowerBool = isFollower === "true" || isFollower === true;

        const followList = await findTwoFollowing(user, isFollowerBool);

        return res.status(200).json({
            follow: followList || []
        });
    } catch (e) {
        next(e);
    }
}

export const followStatus = async (req, res, next) =>{
    try{
        const targetUser = req.resolvedUser;
        const follower = {if: req.user.id};
        const result = await isFollowing(follower, targetUser);

        return res.status(200).json({
            status: "success",
            data: result
        })
    }catch (e){
        next(e);
    }
}
export const followUserController = async (req, res, next) => {
    try {
        const targetUser = req.resolvedUser;
        const follower = { id: req.user.id };

        const result = await followUser(follower, targetUser);

        return res.status(201).json({
            status: "success",
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

export const unfollowUserController = async (req, res, next) => {
    try {
        const targetUser = req.resolvedUser;
        const follower = { id: req.user.id };

        const result = await unfollowUser(follower, targetUser);

        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

// Called when viewing the Gallery tab
export const getUserGallery = async (req, res, next) => {
    try {
        const user = req.resolvedUser;

        // Parse pagination criteria safely from the incoming query string
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

        // Thread variables downstream so the service layer executes a paginated chunk
        const galleryData = await getGalleryByUserId(user, page, limit);

        return res.status(200).json({ status: "success", data: galleryData });
    } catch (e) {
        next(e);
    }
};

export const profilePostsController = async (req, res, next) => {
    try{
        const user = req.resolvedUser;
        const allPostData = await findProfilePosts(user.id);
        return res.status(200).json({status: "success", data: allPostData});
    }catch (e){
        next(e);
    }
}