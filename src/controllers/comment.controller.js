// comment controller
import {createCommentService} from "../services/comment.service.js";
import {findProfilePrevComments} from "../services/profile.service.js";
import {findFeedPrevComments} from "../services/feed.service.js";

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
        const userId = req.resolvedUser.id; // The owner of the page/feed
        let comments;

        // Dispatch based on the route context
        // If the URL starts with /profile, it's profile posts
        // If the URL starts with /feed, it's feed posts
        if (req.baseUrl.includes('profile')) {
            comments = await findProfilePrevComments(userId);
        } else {
            comments = await findFeedPrevComments(userId);
        }

        if (!comments || comments.length === 0) {
            return res.status(404).json({ status: "success", message: "No comments found!" });
        }

        return res.status(200).json({ status: "success", data: comments });
    } catch (e) {
        next(e);
    }
};


