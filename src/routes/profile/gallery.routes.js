import express from "express";

const router = express.Router();

router.get("/", async (req, res, next)=>{
    try {
        // fetch all images used in posts except for profile and background images (privacy concern)
        return res.status(501).json({
            error: "Not Implemented",
            message: "Gallery feature has not been implemented yet"
        });
    } catch (e){
        next(e);
    }
});

export default router;
