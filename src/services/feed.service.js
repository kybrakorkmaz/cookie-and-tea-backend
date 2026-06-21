import {
    createNewPost,
    findPostById,
    getFeedTimelineFromDB,
} from "../repositories/feed.repository.js";

export const getFeedTimeline = async (userId) =>{
    const allUsersPosts = await getFeedTimelineFromDB(userId);
    if (!allUsersPosts || allUsersPosts.length <= 0) {
        return [];
    }
    return allUsersPosts;
}

export const addNewPost = async (userId, newPostPayload) => {
    const formattedData = {
        userId,
        type: newPostPayload.type || "text",
        header: newPostPayload.header,
        content: newPostPayload.content,
        images: newPostPayload.images || [],
        videos: newPostPayload.videos || []
    };

    const response = await createNewPost(formattedData);
    if (!response) {
        const error = new Error("Post creation failed");
        error.statusCode = 500;
        throw error;
    }
    return response;
};

