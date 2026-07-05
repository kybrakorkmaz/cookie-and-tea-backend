import multer from "multer";

const upload = multer({storage: multer.memoryStorage()});
export const uploadMiddleware = upload.fields([
    {name: "images", maxCount: 10},
    {name: "videos", maxCount: 5}
])