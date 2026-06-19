import {addNewPost, deletePost, getFeedTimeline, getPostById, updatePost} from "../services/feed.service.js";


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
        const post = await getPostById(id);

        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }

        // Map backend schema to frontend expectations
        const responseData = {
            post_id: post.id,
            user_id: post.userId,
            post_type: post.type,
            post_header: post.header,
            post_detail: post.content,
            post_image: post.images || [],
            post_video: post.videos || [],
            comment_count: post.commentCount || 0,
            donation_sum: post.donationSum || 0,
            post_date: post.createdAt ? new Date(post.createdAt) : ""
        };

        res.status(200).json({
            status: "success",
            data: responseData
        });
    } catch (e) {
        next(e);
    }
};

export const addNewPostController = async (req, res, next) => {
    try {
        const user = req.resolvedUser;
        const postData = req.body;
        const newPost = await addNewPost(user.id, postData);

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
        const user = req.user; // Use req.user (authenticated user) for authorization
        const updateData = req.body;
        const updatedPost = await updatePost(user.id, id, updateData);

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
        const user = req.user; // Use req.user (authenticated user) for authorization
        await deletePost(user.id, id);
        res.status(204).end();
    } catch (e) {
        next(e);
    }
};


