import {deletePostById, getPostById, updatePostById} from "../repositories/post.repository.js";

export const findPost = async (postId) => {
    const isExist = await getPostById(postId);

    // Drizzle select statements always return an array
    if (!isExist || isExist.length === 0) {
        const error = new Error("Post does not exist!");
        error.statusCode = 404;
        throw error;
    }
    return isExist[0];
};

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

    // Simplified: deletePostById returns an object or null, never an array now
    if (!deleted) {
        const error = new Error("Unauthorized request or post not found");
        error.statusCode = 403;
        throw error;
    }
    return deleted;
};