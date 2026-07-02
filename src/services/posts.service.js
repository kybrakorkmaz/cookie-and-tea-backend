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
    // 1. First, check if the post exists
    const existing = await getPostById(postId);
    if (!existing || existing.length === 0) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Second, check if it belongs to the user
    if (existing[0].userId !== userId) {
        const error = new Error("Forbidden: You do not own this post");
        error.statusCode = 403;
        throw error;
    }

    // 3. Perform the update
    const updated = await updatePostById(userId, postId, updatePayload);
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