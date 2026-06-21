import {getUserAllPostsFromDB} from "../repositories/post.repository.js";
import {deletePostById, findPostById, updatePostById} from "../repositories/feed.repository.js";

export const getPostById = async (postId) => {
    const post = await findPostById(postId);
    if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
    }
    return post;
};

export const findAllPosts = async (userId) =>{
    const userPosts= await getUserAllPostsFromDB(userId);
    if (!userPosts ||  userPosts.length <= 0) {
        const error = new Error("No post found!");
        error.statusCode = 204;
        throw error;
    }
    // Map database properties directly to frontend component layout values
    return userPosts;
}

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
    if (!deleted) {
        const error = new Error("Unauthorized request or post not found");
        error.statusCode = 403;
        throw error;
    }
    return deleted;
};