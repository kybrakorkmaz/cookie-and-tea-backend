// feed service
import {
    createNewPost, getFeedPostIds,
    getFeedTimelineFromDB,
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
    const rawComments = await fetchPrevCommentsForIds(postIds, 1, postIds.length * 2);

    // Group comments by postId
    const commentsByPost = (rawComments || []).reduce((acc, c) => {
        const pid = c.postId || c.post_id || c.postId;
        if (!pid) return acc;
        if (!acc[pid]) acc[pid] = [];
        // Keep insertion order (assumed to be newest first from repo)
        acc[pid].push(c);
        return acc;
    }, {});

    // Attach previewComments (max 2) to each post
    const postsWithPreview = allUsersPosts.map(post => ({
        ...post,
        previewComments: (commentsByPost[post.id] || []).slice(0,2)
    }));

    return postsWithPreview;
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


export const findFeedPrevComments = async (userId, page = 1, limit = 20) =>{
    // 1. Get IDs from your posts repository
    const allPostIds = await getFeedPostIds(userId);
    if (!allPostIds || allPostIds.length === 0) return [];

    // 2. Fetch comments using the repo
    return await fetchPrevCommentsForIds(allPostIds, page, limit);
}
