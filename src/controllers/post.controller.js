import {uploadToCloudinary} from "../config/cloudinary.js";
import {deletePost, findPost, updatePost} from "../services/posts.service.js";


export const updatePostController = async (req, res, next) => {
    try {
        // FIX: Ensure consistency with your new routing standard (:postId)
        const postId = parseInt(req.params.postId, 10);
        const userId = req.user.id;

        const { header, content, existingImages, existingVideos } = req.body;

        // Normalize single-entry strings to arrays, and drop any blob: URLs —
        // those are client-side preview artifacts, never real retained media
        const parseMedia = (data) => (Array.isArray(data) ? data : (data ? [data] : []))
            .filter(url => typeof url === "string" && !url.startsWith("blob:"));

        const finalImages = parseMedia(existingImages);
        const finalVideos = parseMedia(existingVideos);

        // Process new uploads...
        if (req.files?.images) {
            for (const file of req.files.images) {
                finalImages.push(await uploadToCloudinary(file.buffer, "image"));
            }
        }

        // Process new video uploads (mirrors the images pipeline)
        if (req.files?.videos) {
            for (const file of req.files.videos) {
                finalVideos.push(await uploadToCloudinary(file.buffer, "video"));
            }
        }

        // Derive the type server-side from the final media state — never trust the
        // client's `type` field (a text post gaining an image must become "image")
        const derivedType =
            finalImages.length > 0 && finalVideos.length > 0 ? "hybrid"
                : finalImages.length > 0 ? "image"
                : finalVideos.length > 0 ? "video"
                : "text";

        // SERVICE LAYER SHOULD HANDLE AUTHORIZATION
        // The service should check if the post belongs to userId and throw a 403 if not.
        const updatedPost = await updatePost(userId, postId, {
            header,
            content,
            type: derivedType,
            images: finalImages,
            videos: finalVideos
        });

        res.status(200).json({ status: "success", data: updatedPost });
    } catch (e) { next(e); }
};

export const deletePostController = async (req, res, next) => {
    try {
        // Route standard is :postId (see posts.route.js) — req.params.id never exists
        const postId = parseInt(req.params.postId, 10);
        const userId = req.user.id; // Logged-in User ID

        // Service handles the authorization check
        await deletePost(userId, postId);

        return res.status(204).end();
    } catch (e) {
        next(e);
    }
};