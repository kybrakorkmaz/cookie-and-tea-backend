import {addNewPost, getFeedTimeline} from "../services/feed.service.js";
import {deletePost, getPostById, updatePost} from "../services/posts.service.js";
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
export const getPostController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const posts = await getPostById(id);

        if (!posts) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            status: "success",
            data: posts
        });
    } catch (e) {
        next(e);
    }
};

export const addNewPostController = async (req, res, next) => {
    try {
        const { header, content, type } = req.body;
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

        const newPost = await addNewPost(req.user.id, {
            header,
            content,
            type,
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

export const updatePostController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { header, content, type, existingImages, existingVideos } = req.body;

        // 1. Initialize arrays securely: default to empty array instead of [undefined]
        const finalImages = Array.isArray(existingImages) ? existingImages : (existingImages ? [existingImages] : []);
        const finalVideos = Array.isArray(existingVideos) ? existingVideos : (existingVideos ? [existingVideos] : []);

        // 2. Upload NEW binary files from req.files
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

        // 3. Update the database
        const updatedPost = await updatePost(req.user.id, id, {
            type,
            header,
            content,
            images: finalImages,
            videos: finalVideos
        });

        res.status(200).json({ status: "success", data: updatedPost });
    } catch (e) {
        next(e); // Properly forward async errors to error middleware
    }
};


export const deletePostController = async (req, res, next) => {
    try {
        const { id } = req.params;
        await deletePost(req.user.id, id);
        res.status(204).end();
    } catch (e) {
        next(e);
    }
};


