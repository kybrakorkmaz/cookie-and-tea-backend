import multer from "multer";

// Post media uploads: memory storage, but bounded — 5MB/file matches
// fileValidator.middleware.js, and the MIME filter rejects junk at the door
// instead of after buffering it into memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 15 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype?.startsWith("image/") || file.mimetype?.startsWith("video/")) return cb(null, true);
        const err = new Error("Only image or video files are allowed.");
        err.statusCode = 400;
        cb(err);
    }
});
export const uploadMiddleware = upload.fields([
    {name: "images", maxCount: 10},
    {name: "videos", maxCount: 5}
])

// Single-image uploads (profile photo / cover image) — images only, 5MB cap
const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype?.startsWith("image/")) return cb(null, true);
        const err = new Error("Only image files are allowed.");
        err.statusCode = 400;
        cb(err);
    }
});
export const uploadSingleImage = imageUpload.single("file");