import {
    createComment,
    deleteComment, fetchAllComments,
    findPrevComments,
    updateComment
} from "../repositories/comment.repository.js";

export const createCommentService = async (userId, postId, comment) => {
    return await createComment(userId, postId, comment);
};

// This is the common utility both Feed and Profile services call
export const fetchPrevCommentsForIds = async (postIds) => {
    if (!postIds || postIds.length === 0) return [];
    // Passes the array directly to the repository
    return await findPrevComments(postIds);
};

export const findAllComments = async (postId, page = 1, limit = 20) =>{
    if (!postId) {
        const error = new Error("Bad request!, Empty Post Id");
        error.statusCode = 400;
        throw error;
    }
    return await fetchAllComments(postId, page, limit);
}

export const updateCommentService = async ({ commentId, commenterId, comment }) => {
    // Repository handles ownership: WHERE id = commentId AND userId = commenterId
    const result = await updateComment({ commentId, commenterId, comment });

    if (!result || result.length === 0) {
        // Here we differentiate between 404 (Doesn't exist) and 403 (Not yours)
        // For security, APIs often return 404 for both to avoid enumerating resources
        const error = new Error("Comment not found or access denied");
        error.statusCode = 404;
        throw error;
    }
    return result[0];
};

export const deleteCommentService = async ({ commentId, commenterId }) => {
    const result = await deleteComment({ commentId, commenterId });
    if (!result || result.length === 0) {
        const error = new Error("Comment not found or access denied");
        error.statusCode = 404;
        throw error;
    }
    return result;
};