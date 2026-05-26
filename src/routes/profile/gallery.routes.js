import express from "express";

const router = express.Router();

router.get("/", async (req, res, next)=>{
    try {
      // fetch all images used in posts except for profile and background images (privacy concern)
    } catch (e){
        next(e);
    }
});

export default router;