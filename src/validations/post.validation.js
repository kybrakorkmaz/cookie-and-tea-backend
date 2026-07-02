import { z } from "zod";

const idValidator = z.coerce.number().int().positive();

export const postSchema = {
    // Used for the URL /.../posts/:postId
    params: z.object({
        postId: idValidator
    }),
    // Used for creation
    create: z.object({
        body: z.object({
            header: z.string().trim().min(1).max(200),
            content: z.string().trim().max(1500).or(z.literal("")).optional(),
            // 'type' is usually determined by the server, not the user.
            // If the user MUST provide it, keep it, but make it optional for updates.
            type: z.enum(["text", "image", "video", "hybrid"]).optional()
        })
    }),
    // Used for updates
    update: z.object({
        body: z.object({
            header: z.string().trim().min(1).max(200).optional(),
            content: z.string().trim().max(1500).or(z.literal("")).optional(),
            existingImages: z.array(z.string()).optional(),
            existingVideos: z.array(z.string()).optional()
        })
    })
};