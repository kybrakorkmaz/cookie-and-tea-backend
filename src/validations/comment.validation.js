import {z} from "zod";
export const commentSchema = z.object({
    body: z.object({
        comment: z.string().trim().min(1, "Empty Comment!").max(500, "Too long!")
    })
});