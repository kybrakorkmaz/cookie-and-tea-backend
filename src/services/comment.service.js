import {
    createComment,
    deleteComment,
    findAllComments,
    findPrevComments,
    updateComment
} from "../repositories/comment.repository.js";

export const createCommentService = async (userId, postId, comment) => {
    return await createComment(userId, postId, comment);
};

// This is the common utility both Feed and Profile services call
export const fetchPrevCommentsForIds = async (postIds, page = 1, limit = 20) => {
    if (!postIds || postIds.length === 0) return [];
    // Normalize IDs to an array of numbers
    const ids = postIds.map(p => typeof p === "object" ? p.postId : p);

    return await findPrevComments(ids, page, limit);
};

export const fetchAllCommentsForIds = async (postIds, page = 1, limit = 20) =>{
    if (!postIds || postIds.length === 0) return [];
    const ids = postIds.map(p => typeof p === "object" ? p.postId : p);

    return await findAllComments(ids, page, limit);
}
// Accept contextual ownership variables and attach a 404 code status
export const updateCommentService = async ({ commentId, commenterId, comment }) =>{
    const result = await updateComment({ commentId, commenterId, comment });
    if(!result || result.length === 0){
        const error = new Error("Comment not found");
        error.statusCode = 404;
        throw error;
    }
    return result[0];
}

// Restructure argument to transparently route ownership verification details
export const deleteCommentService = async ({ commentId, commenterId }) =>{
    const result = await deleteComment({ commentId, commenterId });
    if (!result || result.length === 0) {
        const error = new Error("Comment not found");
        error.statusCode = 404;
        throw error;
    }
    return result;
}