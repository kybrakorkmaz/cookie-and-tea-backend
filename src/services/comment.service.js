import { createComment, findPrevComments } from "../repositories/comment.repository.js";

export const createCommentService = async (userId, postId, comment) => {
    return await createComment(userId, postId, comment);
};

export const fetchCommentsForIds = async (postIds) => {
    return await findPrevComments(postIds);
};