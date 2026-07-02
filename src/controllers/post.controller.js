import {uploadToCloudinary} from "../config/cloudinary.js";
import {deletePost, findPost, updatePost} from "../services/posts.service.js";


export const updatePostController = async (req, res, next) => {
    try {
        // FIX: Ensure consistency with your new routing standard (:postId)
        const postId = parseInt(req.params.postId, 10);
        const userId = req.user.id;

        const { header, content, existingImages, existingVideos } = req.body;

        // Move the parsing logic to a helper file or just keep it clean
        const parseMedia = (data) => (Array.isArray(data) ? data : (data ? [data] : []));

        const finalImages = parseMedia(existingImages);
        const finalVideos = parseMedia(existingVideos);

        // Process new uploads...
        if (req.files?.images) {
            for (const file of req.files.images) {
                finalImages.push(await uploadToCloudinary(file.buffer, "image"));
            }
        }

        // SERVICE LAYER SHOULD HANDLE AUTHORIZATION
        // The service should check if the post belongs to userId and throw a 403 if not.
        const updatedPost = await updatePost(userId, postId, {
            header,
            content,
            images: finalImages,
            videos: finalVideos
        });

        res.status(200).json({ status: "success", data: updatedPost });
    } catch (e) { next(e); }
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