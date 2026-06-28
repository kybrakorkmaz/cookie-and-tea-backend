// feed service
import {
    createNewPost, getFeedPostIds,
    getFeedTimelineFromDB,
} from "../repositories/feed.repository.js";
import {fetchCommentsForIds} from "./comment.service.js";

export const getFeedTimeline = async (userId, limit, offset) =>{
    const allUsersPosts = await getFeedTimelineFromDB(userId, limit, offset);

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


export const findFeedPrevComments = async (userId) =>{
    // 1. Get IDs from your posts repository
    const allPostIds = await getFeedPostIds(userId);
    if (!allPostIds || allPostIds.length === 0) return [];

    // 2. Fetch comments using the repo
    return await fetchCommentsForIds(allPostIds);
}
