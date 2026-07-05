import { z } from "zod";

// Shared ID validator to ensure consistency across the whole app
const idValidator = z.coerce.number().int().positive();

export const commentSchema = {
    // Used for routes like /posts/:postId/comment
    postId: z.object({
        params: z.object({ postId: idValidator })
    }),
    // Used for routes like /posts/:postId/comment/:commentId
    commentId: z.object({
        params: z.object({
            postId: idValidator,
            commentId: idValidator
        })
    }),
    body: z.object({
        body: z.object({
            comment: z.string().trim().min(1, "Empty Comment!").max(500, "Too long!")
        })
    })
};