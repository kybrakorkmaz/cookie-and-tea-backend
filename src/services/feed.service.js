// feed service
import {
    createNewPost, getFeedPostIds,
    getFeedTimelineFromDB,
    countFeedTimelineFromDB,
} from "../repositories/feed.repository.js";
import {attachPreviewComments, fetchPrevCommentsForIds} from "./comment.service.js";

export const getFeedTimeline = async (userId, limit, offset) =>{
    const allUsersPosts = await getFeedTimelineFromDB(userId, limit, offset);

    if (!allUsersPosts || allUsersPosts.length <= 0) {
        return [];
    }

    const postIds = allUsersPosts.map(p => p.id);
    const rawComments = await fetchPrevCommentsForIds(postIds);
    return attachPreviewComments(allUsersPosts, rawComments);
}

export const countFeedTimeline = (userId) => countFeedTimelineFromDB(userId);

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
    const allPostIds = await getFeedPostIds(userId);
    if (!allPostIds || allPostIds.length === 0) return [];

    return await fetchPrevCommentsForIds(allPostIds);
}
