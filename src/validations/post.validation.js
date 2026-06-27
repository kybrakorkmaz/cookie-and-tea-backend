import {z} from "zod";
export const postSchema = z.object({
    body: z.object({
        header: z.string().trim().min(1, "Post header cannot be empty!").max(200),
        type: z.enum(["text", "image", "video", "hybrid"]),
        content: z.string().trim().max(1500).or(z.literal("")).optional(),
    })
});