import {addNewPost, getFeedTimeline} from "../services/feed.service.js";
import {deletePost, getPostById, updatePost} from "../services/posts.service.js";
export const getFeedTimelineController = async (req, res, next) =>{
    try {
        const user = req.resolvedUser;
        const feed = await getFeedTimeline(user.id);

        res.status(200).json({
            status: "success",
            data: feed
        });
    }catch (e){
        next(e);
    }
}
export const getPostController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const posts = await getPostById(id);

        if (!posts) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            status: "success",
            data: posts
        });
    } catch (e) {
        next(e);
    }
};

export const addNewPostController = async (req, res, next) => {
    try {
        const postData = req.body;
        const newPost = await addNewPost(req.user.id, postData);

        res.status(201).json({
            status: "success",
            data: newPost
        });
    } catch (e) {
        next(e);
    }
};
export const updatePostController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedPost = await updatePost(req.user.id, id, updateData);

        res.status(200).json({
            status: "success",
            data: updatedPost
        });
    } catch (e) {
        next(e);
    }
};


export const deletePostController = async (req, res, next) => {
    try {
        const { id } = req.params;
        await deletePost(req.user.id, id);
        res.status(204).end();
    } catch (e) {
        next(e);
    }
};


