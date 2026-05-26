import express from "express";

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        // fetch all images used in posts except for profile and background images
        // Replace with your actual repository/service call
        const images = await getGalleryImages();

        res.status(200).json({ images }); // always respond
    } catch (e) {
        next(e); // keep existing error handling
    }
});

export default router;
