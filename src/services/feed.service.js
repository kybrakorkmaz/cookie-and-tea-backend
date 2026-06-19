import {
    createNewPost,
    deletePostById,
    findPostById,
    getFeedTimelineFromDB,
    updatePostById
} from "../repositories/feed.repository.js";
import {deletePostByIds, findPostByIds, updatePostByIds} from "../repositories/post.repository.js";


export const getFeedTimeline = async (userId) =>{
    const databasePosts = await getFeedTimelineFromDB(userId);

    return databasePosts.map(post => ({
        post_id: post.id,
        user_id: post.userId,
        post_type: post.type,
        post_header: post.header,
        post_detail: post.content,
        post_image: post.images || [],
        post_video: post.videos || [],
        comment_count: post.commentCount || 0,
        donation_sum: post.donationSum || 0,
        post_date: post.createdAt ? new Date(post.createdAt): "",
        user: {
            name: post.authorName,
            username: post.authorUsername,
            profileImage: post.authorProfileImage
        }
    }));
}

export const addNewPost = async (userId, newPostPayload) => {
    const formattedData = {
        userId,
        type: newPostPayload.post_type || "text",
        header: newPostPayload.post_header,
        content: newPostPayload.post_detail,
        images: newPostPayload.post_image || [],
        videos: newPostPayload.post_video || []
    };

    const response = await createNewPost(formattedData);
    if (!response) {
        const error = new Error("Post creation failed");
        error.statusCode = 500;
        throw error;
    }
    return {
        post_id: response.id,
        user_id: response.userId,
        post_type: response.type,
        post_header: response.header,
        post_detail: response.content,
        post_image: response.images || [],
        post_video: response.videos || [],
        comment_count: response.commentCount || 0,
        donation_sum: response.donationSum || 0,
        post_date: response.createdAt ? new Date(response.createdAt) : ""
    };
};

export const updatePost = async (userId, postId, updatePayload) => {
    const formattedUpdate = {
        type: updatePayload.post_type,
        header: updatePayload.post_header,
        content: updatePayload.post_detail,
        images: updatePayload.post_image,
        videos: updatePayload.post_video
    };

    const updated = await updatePostById(userId, postId, formattedUpdate);
    if (!updated || updated.length === 0) {
        const error = new Error("Unauthorized request or post not found");
        error.statusCode = 403;
        throw error;
    }
    const response = updated[0];
    return {
        post_id: response.id,
        user_id: response.userId,
        post_type: response.type,
        post_header: response.header,
        post_detail: response.content,
        post_image: response.images || [],
        post_video: response.videos || [],
        comment_count: response.commentCount || 0,
        donation_sum: response.donationSum || 0,
        post_date: response.createdAt ? new Date(response.createdAt) : ""
    };
};

export const deletePost = async (userId, postId) => {
    const deleted = await deletePostById(userId, postId);
    if (!deleted) {
        const error = new Error("Unauthorized request or post not found");
        error.statusCode = 403;
        throw error;
    }
    return deleted;
};


export const getPostById = async (postId) => {
    const post = await findPostById(postId);
    if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
    }
    return post;
};

