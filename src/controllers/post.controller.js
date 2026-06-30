import {uploadToCloudinary} from "../config/cloudinary.js";
import {deletePost, findPost, updatePost} from "../services/posts.service.js";


export const updatePostController = async (req, res, next) => {
    try {
        const id = Number(req.params.id); // post id
        const userId = req.user.id;

        // 1. Pre-check: Verify ownership before doing ANY expensive operations
        const existingPost = await findPost(id);
        if (existingPost.userId !== userId) {
            const error = new Error("Unauthorized: You cannot modify this post.");
            error.statusCode = 403;
            throw error;
        }

        const { header, content, type, existingImages, existingVideos } = req.body;

        // PARSE THE STRINGS : When using FormData, arrays are sent as JSON strings: '["url1", "url2"]'

        const parseMedia = (data) => {
            if (!data) return [];
            try {
                // If it's already an array (multer sometimes does this), return it
                // Otherwise, try to parse the stringified JSON
                return Array.isArray(data) ? data : JSON.parse(data);
            } catch (e) {
                // If parsing fails (e.g., just a single string), return as single-item array
                return [data];
            }
        };

        const finalImages = parseMedia(existingImages);
        const finalVideos = parseMedia(existingVideos);

        // 2. Upload only AFTER ownership is confirmed
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

        const finalType =
            finalImages.length > 0 && finalVideos.length > 0 ? "hybrid" :
                finalImages.length > 0 ? "image" :
                    finalVideos.length > 0 ? "video" :
                        "text";

        const updatedPost = await updatePost(userId, id, {
            type: finalType,
            header,
            content,
            images: finalImages,
            videos: finalVideos
        });
        res.status(200).json({ status: "success", data: updatedPost });
    } catch (e) {
        next(e);
    }
};

export const deletePostController = async (req, res, next) => {
    try {
        const { id } = req.params; // Post ID
        const userId = req.user.id; // Logged-in User ID

        // Service handles the authorization check
        await deletePost(userId, id);

        return res.status(204).end();
    } catch (e) {
        next(e);
    }
};