export const validateMediaCount = (req, res, next) => {
    const {type} = req.body;
    const images = req.files?.images || [];
    const videos = req.files?.videos || [];

    // Validate counts based on type
    if(type === "images" && images.length === 0) return res.status(400).json({error: "No images provided" });
    if(type === "videos" && videos.length === 0)  return res.status(400).json({error: "No videos provided"});
    if(type === "hybrid" && (images.length === 0 || videos.length === 0)){
        return res.status(400).json({error: "Neither images nor videos provided"});
    }

    // Size check (max 5MB per file
    const maxSize = 5*1024*1024
    for(const file of [...images, ...videos]){
        if(file.size > maxSize) return res.status(400).json({error: `File ${file.orginalname} is too large`});
    }

    next();
}