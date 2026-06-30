import { createComment, findPrevComments } from "../repositories/comment.repository.js";

export const createCommentService = async (userId, postId, comment) => {
    return await createComment(userId, postId, comment);
};

// This is the common utility both Feed and Profile services call
export const fetchCommentsForIds = async (postIds) => {
    return await findPrevComments(postIds);
};