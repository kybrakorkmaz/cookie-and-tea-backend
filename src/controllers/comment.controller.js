// comment controller
import {createCommentService, deleteCommentService, updateCommentService} from "../services/comment.service.js";
import {findAllProfileComments, findProfilePrevComments} from "../services/profile.service.js";
import {findAllFeedComments, findFeedPrevComments} from "../services/feed.service.js";

export const allCommentsController = async (req, res, next) =>{
    try{
        const userId = req.resolvedUser.id; // The owner of the page/feed
        let comments;

        // Dispatch based on the route context
        // If the URL starts with /profile, it's profile posts
        // If the URL starts with /feed, it's feed posts
        if(req.baseUrl.includes('profile')){
            comments = await findAllProfileComments(userId);
        }else{
            comments = await findAllFeedComments(userId);
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
        let comments;

        if (req.baseUrl.includes('profile')) {
            comments = await findProfilePrevComments(userId);
        } else {
            comments = await findFeedPrevComments(userId);
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
       // From authenticateToken middleware
       const id = parseInt(req.params.id, 10); // From the updated route path
       const { comment } = req.body;

       // Pass all three identifiers to your service layer to guarantee integrity
       const updatedComment = await updateCommentService(id, comment);

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
        const id = parseInt(req.params.id, 10); // From the updated route path
        await deleteCommentService(id);
        return res.status(204).end();

    }catch (e){
        next(e);
    }
}