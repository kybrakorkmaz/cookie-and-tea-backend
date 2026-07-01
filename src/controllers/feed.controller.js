// feed controller
import {addNewPost, getFeedTimeline} from "../services/feed.service.js";

import {uploadToCloudinary} from "../config/cloudinary.js";
export const getFeedTimelineController = async (req, res, next) =>{
    try {
        const user = req.resolvedUser;

        const limit = parseInt(req.query.limit, 10) || 5;
        const offset = parseInt(req.query.offset, 10) || 0;

        const feed = await getFeedTimeline(user.id, limit, offset);

        res.status(200).json({
            status: "success",
            data: feed
        });
    }catch (e){
        next(e);
    }
}

// USER ONLY CAN CREATE A NEW POST ON FEED PAGE
export const createPostController = async (req, res, next) => {
    try {
        const { header, content } = req.body; //  Ignore untrusted type from request body
        // Guard: Ensure req.files is an object before accessing properties
        const files = req.files || {};

        const imageUrls = [];
        const videoUrls = [];

        // Process Images
        if (files.images) {
            for (const file of files.images) {
                const url = await uploadToCloudinary(file.buffer, "image");
                imageUrls.push(url);
            }
        }

        // Process Videos
        if (files.videos) {
            for (const file of files.videos) {
                const url = await uploadToCloudinary(file.buffer, "video");
                videoUrls.push(url);
            }
        }

        // Derive the post type programmatically from successfully resolved media links
        let derivedType = "text";
        if (imageUrls.length > 0 && videoUrls.length > 0) {
            derivedType = "hybrid";
        } else if (imageUrls.length > 0) {
            derivedType = "image";
        } else if (videoUrls.length > 0) {
            derivedType = "video";
        }

        const newPost = await addNewPost(req.user.id, {
            header,
            content,
            type: derivedType,
            images: imageUrls,
            videos: videoUrls
        });

        res.status(201).json({
            status: "success",
            data: newPost
        });
    } catch (e) {
        next(e);
    }
};




