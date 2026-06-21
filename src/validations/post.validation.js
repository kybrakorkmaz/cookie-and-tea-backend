import {z} from "zod";
export const postSchema = z.object({
    body: z.object({
        header: z.string().trim().min(1, "Post header cannot be empty!").max(200, "Post header too long"),
        type: z.enum(["text", "image", "video", "hybrid"]),
        content: z.string()
            .trim()
            .max(1500, "Content cannot exceed 1500 characters!")
            .optional()
            .or(z.literal("")),
        images: z.array(z.string().trim().min(1, "Image media item cannot be empty")).optional().default([]),
        videos: z.array(z.string().trim().min(1, "Video media item cannot be empty")).optional().default([])
    }).refine(data => {
        if (data.type === "text") return true;
        if (data.type === "image" && data.images.length > 0) return true;
        if (data.type === "video" && data.videos.length > 0) return true;
        if (data.type === "hybrid" && (data.images.length > 0 || data.videos.length > 0)) return true;
        return false;
    }, {
        message: "Media required for selected post type",
        path: ["type"]
    })
});