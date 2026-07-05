import {fetchImagesForUserPosts} from "../repositories/gallery.repository.js";

export const getGalleryForUser = async (userId, page = 1, limit = 20) =>{
    const rawPostsMedia = await fetchImagesForUserPosts(userId);

    const flattened = (rawPostsMedia || []).flatMap(post => {
        const images = post.imageUrl || [];
        return images.map(url => ({ postId: post.id, imageUrl: url }));
    });

    const p = Number.isNaN(Number(page)) ? 1 : Math.max(1, parseInt(page, 10));
    const l = Number.isNaN(Number(limit)) ? 20 : Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const paged = flattened.slice(offset, offset + l);

    return {
        userId,
        images: paged,
        meta: {
            total: flattened.length,
            page: p,
            limit: l
        }
    };
};
