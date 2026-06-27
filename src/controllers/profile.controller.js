import {
    changeAbout,
    earnedMoney,
    getIntroDashboard,
    getPanelInfo, findTwoFollowing,
    getUserAboutInfo, updateSocialMediaList, getGalleryByUserId
} from "../services/profile.service.js";
import {deletePost, findAllPosts, updatePost} from "../services/posts.service.js";
import {uploadToCloudinary} from "../config/cloudinary.js";

// Called ONCE when the profile page loads
export const getUserPanel = async (req, res, next) => {
    try {
        const user = req.resolvedUser; 
        const panelData = await getPanelInfo(user);
        return res.status(200).json(panelData);
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
// Called when viewing the Gallery tab
export const getUserGallery = async (req, res, next) => {
    try {
        const user = req.resolvedUser;
        const galleryData = await getGalleryByUserId(user);
        return res.status(200).json({ status: "success", data: galleryData });
    } catch (e) {
        next(e);
    }
};

export const profilePostsController = async (req, res, next) => {
    try{
       const user = req.resolvedUser;
       const allPostData = await findAllPosts(user.id);
       return res.status(200).json({status: "success", data: allPostData});
    }catch (e){
        next(e);
    }
}

export const profilePostEditController = async (req, res, next) => {
    try {
        const user = req.resolvedUser;
        const { id } = req.params;

        // 1. Destructure from req.body (populated by multer)
        const { header, content, type, existingImages, existingVideos } = req.body;

        // 2. PARSE THE STRINGS: This is the missing step
        // When using FormData, arrays are sent as JSON strings: '["url1", "url2"]'
        const parseMedia = (data) => {
            if (!data) return [];
            try {
                // If it's already an array (multer sometimes does this), return it
                if (Array.isArray(data)) return data;
                // Otherwise, try to parse the stringified JSON
                return JSON.parse(data);
            } catch (e) {
                // If parsing fails (e.g., just a single string), return as single-item array
                return [data];
            }
        };
        const finalImages = parseMedia(existingImages);
        const finalVideos = parseMedia(existingVideos);

        if (req.files?.images) {
            for (const file of req.files.images) {
                const url = await uploadToCloudinary(file.buffer, "image");
                finalImages.push(url);
            }
        }

        if (req.files?.videos) {
            for (const file of req.files.videos) {
                const url = await uploadToCloudinary(file.buffer, "video");
                finalVideos.push(url);
            }
        }

        // 3. SECURE AUTH CHECK
        if (req.user.id !== user.id) {
            const error = new Error("Unauthorized: You can only update your own posts.");
            error.statusCode = 403;
            throw error;
        }

        // Ensure type is text if no media exists
        const resolvedType = (finalImages.length === 0 && finalVideos.length === 0)
            ? "text"
            : type;

        // 4. Construct payload
        // IMPORTANT: If you want to support uploading NEW files here as well,
        // you must add the cloudinary loop here just like you did in updatePostController
        const updatePayload = {
            type: resolvedType,
            header,
            content,
            images: finalImages,
            videos: finalVideos
        };

        // 5. Update
        const updatedPost = await updatePost(user.id, id, updatePayload);

        return res.status(200).json({
            status: "success",
            data: updatedPost
        });
    } catch (e) {
        // This will now catch the error if JSON.parse fails
        // or if 'type' is missing/invalid
        next(e);
    }
}

export const profilePostDeleteController = async (req, res, next) =>{
    try{
        const user = req.resolvedUser;
        const {id}= req.params; // post id

        if (req.user.id !== user.id) {
            const error = new Error("Unauthorized: You can only delete your own posts.");
            error.statusCode = 403;
            throw error;
        }

        const deletedPost = await deletePost(user.id, id);

        return res.status(204).json({
            status: "success",
            data: deletedPost
        });

    }catch (e){
        next(e);
    }
}