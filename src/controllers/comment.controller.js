// comment controller
import {
    createCommentService,
    deleteCommentService,
    findAllComments,
    updateCommentService
} from "../services/comment.service.js";
import {findProfilePrevComments} from "../services/profile.service.js";
import { findFeedPrevComments} from "../services/feed.service.js";

export const allCommentsController = async (req, res, next) => {
    try {
        // Correct: req.params.postId is the value directly
        const postId = parseInt(req.params.postId, 10);

        if (isNaN(postId)) {
            return res.status(400).json({ status: "fail", message: "Invalid post ID" });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;

        const comments = await findAllComments(postId, page, limit);

        // Industry Standard: Returning an empty array is NOT a 404.
        // A 404 means the post itself doesn't exist. An empty array means the post exists but has no comments.
        return res.status(200).json({ status: "success", data: comments || [] });
    } catch (e) { next(e); }
};

export const previewCommentsController = async (req, res, next) => {
    try {
        let comments;
        if (req.baseUrl.includes("profile")) {
            comments = await findProfilePrevComments(req.resolvedUser.id);
        } else {
            // Feed preview is the viewer's timeline, same as GET /feed/:username —
            // bind to JWT identity so :username cannot IDOR another user's comments
            comments = await findFeedPrevComments(req.user.id);
        }

        return res.status(200).json({ status: "success", data: comments || [] });
    } catch (e) {
        next(e);
    }
};

export const createCommentController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // req.params.id is the post ID because of mergeParams
        const postId = parseInt(req.params.postId, 10);
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

export const updateCommentController = async (req, res, next) =>{
    try{
        const commentId = parseInt(req.params.commentId, 10);
        const userId = req.user.id;
        const { comment } = req.body;

        // Pass an object containing commenterId to the service layer
        const updatedComment = await updateCommentService({ commentId, commenterId: userId, comment });

        return res.status(200).json({
            status: "success",
            data: updatedComment
        });
    }catch (e){
        next(e);
    }
}

export const deleteCommentController = async (req, res, next) =>{
    try{
        const commentId = parseInt(req.params.commentId, 10);
        const userId = req.user.id; // Capture authenticated user ID to check ownership

        //Pass both parameters down to guarantee data isolation
        await deleteCommentService({ commentId, commenterId: userId });
        return res.status(204).end();

    }catch (e){
        next(e);
    }
}