// feed service
import {
    createNewPost, getFeedPostIds,
    getFeedTimelineFromDB,
    countFeedTimelineFromDB,
} from "../repositories/feed.repository.js";
import {fetchPrevCommentsForIds} from "./comment.service.js";

export const getFeedTimeline = async (userId, limit, offset) =>{
    const allUsersPosts = await getFeedTimelineFromDB(userId, limit, offset);

    if (!allUsersPosts || allUsersPosts.length <= 0) {
        return [];
    }

    // Fetch preview comments for the returned posts (up to 2 per post)
    const postIds = allUsersPosts.map(p => p.id);
    // Request limit: allow up to 2 comments per post
    const rawComments = await fetchPrevCommentsForIds(postIds);

    const commentsByPost = (rawComments || []).reduce((acc, c) => {
        const pid = Number(c.postId ?? c.post_id);
        if (!Number.isFinite(pid)) return acc;
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(c);
        return acc;
    }, {});

    const postsWithPreview = allUsersPosts.map(post => ({
        ...post,
        previewComments: (commentsByPost[Number(post.id)] || []).slice(0, 2)
    }));

    return postsWithPreview;
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


export const findFeedPrevComments = async (userId, page = 1, limit = 20) =>{
    // 1. Get IDs from your posts repository
    const allPostIds = await getFeedPostIds(userId);
    if (!allPostIds || allPostIds.length === 0) return [];

    // 2. Fetch comments using the repo
    return await fetchPrevCommentsForIds(allPostIds);
}
