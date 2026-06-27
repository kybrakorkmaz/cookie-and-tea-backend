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
        const {header, content, type}= req.body;
        const files = req.files; // Multer injects this

        const imageUrls = [];
        const videoUrls = [];

        // Process Images
        if(files.images){
            for(const file of files.images){
                const url = await uploadToCloudinary(file.buffer, "image");
                imageUrls.push(url);
            }
        }

        // Process Videos
        if(files.videos){
            for(const file of files.videos){
                const url = await  uploadToCloudinary(file.buffer, "video");
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
// In feed.controller.js
export const updatePostController = async (req, res, next) => {
    const { id } = req.params;
    const { header, content, existingImages, existingVideos } = req.body;

    // 1. Start with existing URLs that the user kept
    const finalImages = Array.isArray(existingImages) ? existingImages : [existingImages];
    const finalVideos = Array.isArray(existingVideos) ? existingVideos : [existingVideos];

    // 2. Upload NEW binary files from req.files
    if (req.files?.images) {
        for (const file of req.files.images) {
            const url = await uploadToCloudinary(file.buffer, "image");
            finalImages.push(url);
        }
    }

    // 3. Update the database with the finalized array
    const updatedPost = await updatePost(req.user.id, id, {
        header,
        content,
        images: finalImages, // Concatenated array
        videos: finalVideos
    });

    res.status(200).json({ status: "success", data: updatedPost });
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


