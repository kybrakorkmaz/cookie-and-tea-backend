import express from "express";
import {validate} from "../../middleware/validate.js";

const router = express.Router();

/*router.get("/", validate(getGallerySchema), async (req, res, next) => {
    try {
        const { username } = req.query;

        const galleryData = await getGallery(username);

        return res.status(200).json({
            status: "success",
            data: galleryData
        });
    } catch (e) {
        next(e);
    }
});*/

export default router;
