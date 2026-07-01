import express from "express";
import { getUserGallery } from "../../controllers/profile.controller.js";
import { getGalleryController } from "../../controllers/gallery.controller.js";

const router = express.Router({ mergeParams: true });

// Target: GET /api/v1/profile/:username/gallery
// Use dedicated gallery controller which returns images shared on posts only
router.get("/", getGalleryController);

export default router;