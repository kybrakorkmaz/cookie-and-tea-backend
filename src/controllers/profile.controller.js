import {
    changeAbout,
    earnedMoney,
    getIntroDashboard,
    getPanelInfo, findTwoFollowing,
    getUserAboutInfo, updateSocialMediaList
} from "../services/profile.service.js";

// Called ONCE when the profile page loads
export const getUserPanel = async (req, res, next) => {
    try {
        const { username } = req.params; // Clean parameter pulling
        const panelData = await getPanelInfo(username);
        return res.status(200).json(panelData);
    } catch (e) {
        next(e);
    }
};

// Called when viewing the Intro tab
export const getUserIntro = async (req, res, next) => {
    try {
        const { username } = req.params;
        const { earningTimeline, isFollower } = req.query; // Filters remain in query

        const introData = await getIntroDashboard(username, earningTimeline, isFollower);
        return res.status(200).json(introData);
    } catch (e) {
        next(e);
    }
};

export const getUserEarnedMoney = async (req, res, next) =>{
    try{
        const {username} = req.params;
        const {earningTimeline} = req.query; // Expects "30", "90", or "365"

        // Convert the string parameter safely to an integer
        const dayLimit = parseInt(earningTimeline, 10) || 30;
        // Process via business logic layer
        const earningsData = await earnedMoney(username, dayLimit);
        return res.status(200).json(earningsData);
    }catch (e){
        next(e); // Safe forwarding to your winston errorHandler
    }
}
export const getUserAbout = async (req,res,next) =>{
    try{
        const {username} = req.params;

        // Controller blindly delegates to service layer
        const aboutText = await getUserAboutInfo(username);
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
        const { username } = req.params;
        const { about } = req.body; // Read incoming text data from the JSON body payload!

        // Controller passes data down, expecting the service throw errors if invalid
        const updatedProfile = await changeAbout(username, about);

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
        const {username} = req.params;
        const {socials} = req.body; // Array extracted via Zod body wrapper

        const updatedSocialsList = await updateSocialMediaList(username, socials);
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
        const { username } = req.params;
        const { isFollower } = req.query;

        // Convert query string parameter cleanly to boolean comparisons
        const isFollowerBool = isFollower === "true";

        const followList = await findTwoFollowing(username, isFollowerBool);

        return res.status(200).json({
            follow: followList || []
        });
    } catch (e) {
        next(e);
    }
}
// Called when viewing the Gallery tab
export const getUserGallery = async (req, res, next) => {
    try {
        const { username } = req.params;
        const galleryData = await getGallery(username);
        return res.status(200).json({ status: "success", data: galleryData });
    } catch (e) {
        next(e);
    }
};

