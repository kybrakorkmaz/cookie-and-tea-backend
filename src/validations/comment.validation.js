import {z} from "zod";
export const commentSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive()
   }),
    body: z.object({
        comment: z.string().trim().min(1, "Empty Comment!").max(500, "Too long!")
    })
});