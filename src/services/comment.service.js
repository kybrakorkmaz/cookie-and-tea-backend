import {createComment} from "../repositories/comment.repository.js";

export const createCommentService = async (userId, postId, comment) =>{
    const response = await createComment(userId, postId, comment);
    if (!response || response.length === 0) {
        throw new Error("Failed to create comment record");
    }
    return response[0];
}