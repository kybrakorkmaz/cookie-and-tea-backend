import {createCommentService} from "../services/comment.service.js";

export const createCommentController = async (req, res, next) =>{
    try{
        const user = req.resolvedUser;
        const { comment } = req.body;
        const { id: postId } = req.params;
        const response = await createCommentService(user.id, parseInt(postId, 10), comment);
        return res.status(201).json({
            status: "success",
            data: response
        })

    }catch (e){
        next(e);
    }
}