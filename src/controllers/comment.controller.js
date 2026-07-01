// comment controller
import {createCommentService, deleteCommentService, updateCommentService} from "../services/comment.service.js";
import {findAllProfileComments, findProfilePrevComments} from "../services/profile.service.js";
import {findAllFeedComments, findFeedPrevComments} from "../services/feed.service.js";

export const allCommentsController = async (req, res, next) =>{
    try{
        const userId = req.resolvedUser.id; // The owner of the page/feed
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
        let comments;

        // Dispatch based on the route context
        // If the URL starts with /profile, it's profile posts
        // If the URL starts with /feed, it's feed posts
        if(req.baseUrl.includes('profile')){
            comments = await findAllProfileComments(userId, page, limit);
        }else{
            comments = await findAllFeedComments(userId, page, limit);
        }

        if(!comments || comments.length === 0){
            return res.status(404).json({ status: "fail", message: "No comments found!!"});
        }

        return res.status(200).json({status: "success", data: comments});
    }catch (e){
        next(e);
    }
}
export const previewCommentsController = async (req, res, next) => {
    try {
        const userId = req.resolvedUser.id;
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
        let comments;

        if (req.baseUrl.includes('profile')) {
            comments = await findProfilePrevComments(userId, page, limit);
        } else {
            comments = await findFeedPrevComments(userId, page, limit);
        }

        if (!comments || comments.length === 0) {
            return res.status(404).json({ status: "fail", message: "No comments found!" });
        }

        return res.status(200).json({ status: "success", data: comments });
    } catch (e) {
        next(e);
    }
};

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

export const updateCommentController = async (req, res, next) =>{
    try{
        const id = parseInt(req.params.id, 10);
        const userId = req.user.id; // 🎯 FIX: Capture authenticated user ID to check ownership
        const { comment } = req.body;

        // Pass an object containing commenterId to the service layer
        const updatedComment = await updateCommentService({ commentId: id, commenterId: userId, comment });

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
        const id = parseInt(req.params.id, 10);
        const userId = req.user.id; // Capture authenticated user ID to check ownership

        //Pass both parameters down to guarantee data isolation
        await deleteCommentService({ commentId: id, commenterId: userId });
        return res.status(204).end();

    }catch (e){
        next(e);
    }
}