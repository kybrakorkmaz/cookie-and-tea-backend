export const validateMediaCount = (req, res, next) => {
    const { type } = req.body;
    const images = req.files?.images || [];
    const videos = req.files?.videos || [];

    // FIXED: Changed plurals to match schema values: "text" | "image" | "video" | "hybrid"
    if (type === "image" && images.length === 0)
        return res.status(400).json({ error: "No images provided" });

    if (type === "video" && videos.length === 0)
        return res.status(400).json({ error: "No videos provided" });

    if (type === "hybrid" && (images.length === 0 || videos.length === 0)) {
        return res.status(400).json({ error: "Both images and videos are required for hybrid posts" });
    }

    // Size check (max 5MB per file)
    const maxSize = 5 * 1024 * 1024;
    for (const file of [...images, ...videos]) {
        if (file.size > maxSize)
            return res.status(400).json({ error: `File ${file.originalname} is too large` });
    }

    next();
};