import {uploadToCloudinary} from "../config/cloudinary.js";
import {deletePost, updatePost} from "../services/posts.service.js";


export const updatePostController = async (req, res, next) => {
    try {
        const { id } = req.params; // Post ID
        const userId = req.user.id; // Logged-in User ID

        const { header, content, type, existingImages, existingVideos } = req.body;

        // Destructure and Parse
        const parseMedia = (data) => {
            if (!data) return [];
            try {
                if (Array.isArray(data)) return data;
                return JSON.parse(data);
            } catch (e) {
                return [data];
            }
        };

        // 1. Initialize arrays securely: default to empty array instead of [undefined]
        const finalImages = parseMedia(existingImages);
        const finalVideos = parseMedia(existingVideos);

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

        const finalType = (finalImages.length > 0 || finalVideos.length > 0)
            ? type
            : "text";

        const updatePayload = {
            type: finalType,
            header,
            content,
            images: finalImages,
            videos: finalVideos
        };

        const updatedPost = await updatePost(userId, id, updatePayload);

        res.status(200).json({ status: "success", data: updatedPost });
    } catch (e) {
        next(e); // Properly forward async errors to error middleware
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