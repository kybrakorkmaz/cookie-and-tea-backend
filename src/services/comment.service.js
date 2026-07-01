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
export const fetchPrevCommentsForIds = async (postIds) => {
    if (!postIds || postIds.length === 0) return [];
    // Normalize IDs to an array of numbers
    const ids = postIds.map(p => typeof p === "object" ? p.postId : p);

    return await findPrevComments(ids);
};

export const fetchAllCommentsForIds = async (postIds) =>{
    if (!postIds || postIds.length === 0) return [];
    const ids = postIds.map(p => typeof p === "object" ? p.postId : p);

    return await findAllComments(ids);
}
export const updateCommentService = async (commentId, comment) =>{
   const result = await updateComment(commentId,  comment);
   if(!result || result.length === 0){
       throw new Error("Post couldn't updated");
   }
   return result[0];
}

export const deleteCommentService = async (commentId) =>{
    const result = await deleteComment(commentId);
    if (!result || result.length === 0) {
        const error = new Error("Comment not found");
        error.statusCode = 404;
        throw error;
    }
    return result;
}