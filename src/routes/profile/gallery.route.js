import express from "express";
import { getUserGallery } from "../../controllers/profile.controller.js";

const router = express.Router({ mergeParams: true });

// Target: GET /api/v1/profile/:username/gallery
router.get("/", getUserGallery);

export default router;