import {z} from "zod";
export const postSchema = z.object({
    body: z.object({
        post_header: z.string().min(1, "Post header cannot be empty!"),
        post_type: z.enum(["text", "image", "video", "hybrid"]),
        post_detail: z.string()
            .max(1500, "content cannot exceed 1500 characters!")
            .optional()
            .or(z.literal("")),
        post_image: z.array(z.string()).optional().default([]),
        post_video: z.array(z.string()).optional().default([])
    }).refine(data =>{
        if(data.post_type === "image" && (!data.post_image ||data.post_image.length<=0)){
            return false;
        }
        if(data.post_type === "video" && (!data.post_video ||data.post_video.length<=0)){
            return false;
        }
        if(data.post_type === "hybrid" && (
            (!data.post_image ||data.post_image.length<=0)
            || (!data.post_video ||data.post_video.length<=0)
        )){
            return false;
        }
        return true;
    }, {
        message: "Media required for selected post type"
    })
});