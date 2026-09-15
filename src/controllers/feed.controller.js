// feed controller
import {addNewPost, getFeedTimeline, countFeedTimeline} from "../services/feed.service.js";

import {uploadToCloudinary} from "../config/cloudinary.js";
export const getFeedTimelineController = async (req, res, next) =>{
    try {
        // IDOR fix: the timeline is "posts from people the VIEWER follows", so it
        // must be bound to the JWT identity — not the :username path param
        // (resolveGlobalUsername would otherwise let anyone read another user's feed)
        const user = req.user;

        const parsedLimit = parseInt(req.query.limit, 10);
        const parsedOffset = parseInt(req.query.offset, 10);
        const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
            ? Math.min(parsedLimit, 100)
            : 5;
        const offset = Number.isInteger(parsedOffset) && parsedOffset >= 0
            ? parsedOffset
            : 0;

        const [feed, total] = await Promise.all([
            getFeedTimeline(user.id, limit, offset),
            countFeedTimeline(user.id),
        ]);

        res.status(200).json({
            status: "success",
            data: feed,
            meta: { total, limit, offset }
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




