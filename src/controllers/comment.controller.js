// comment controller
import {createCommentService} from "../services/comment.service.js";

export const createCommentController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // req.params.id is the post ID because of mergeParams
        const postId = parseInt(req.params.id, 10);
        const { comment } = req.body;

        const response = await createCommentService(userId, postId, comment);

        return res.status(201).json({
            status: "success",
            data: response
        });
    } catch (e) {
        next(e);
    }
};

export const previewCommentsController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let comments;

        // Determine context: are we on a profile or feed?
        // You can check req.baseUrl or a query param
        if (req.baseUrl.includes('profile')) {
            comments = await findProfilePrevComments(userId);
        } else {
            comments = await findFeedPrevComments(userId);
        }

        return res.status(200).json({ status: "success", data: comments });
    } catch (e) {
        next(e);
    }
};


