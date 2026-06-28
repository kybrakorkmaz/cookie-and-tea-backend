import {deletePostById, updatePostById} from "../repositories/post.repository.js";

export const updatePost = async (userId, postId, updatePayload) => {
    const formattedUpdate = {
        type: updatePayload.type,
        header: updatePayload.header,
        content: updatePayload.content,
        images: updatePayload.images,
        videos: updatePayload.videos
    };

    const updated = await updatePostById(userId, postId, formattedUpdate);
    if (!updated || updated.length === 0) {
        const error = new Error("Unauthorized request or post not found");
        error.statusCode = 403;
        throw error;
    }
    return updated[0];
};

export const deletePost = async (userId, postId) => {
    const deleted = await deletePostById(userId, postId);
    if (!deleted || (Array.isArray(deleted) && deleted.length === 0)) {
        const error = new Error("Unauthorized request or post not found");
        error.statusCode = 403;
        throw error;
    }
    return deleted;
};
