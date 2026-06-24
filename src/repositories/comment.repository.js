import {db} from "../db/client.js";
import {comments} from "../db/schema/index.js";

export const createComment = async (userId, postId, comment) =>{
    return  db.insert(comments)
        .values({
            commenterId: userId,
            postId: postId,
            comment: comment
        }).returning();
}