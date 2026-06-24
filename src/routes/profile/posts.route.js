import express from "express";
import {
    profilePostDeleteController,
    profilePostEditController,
    profilePostsController
} from "../../controllers/profile.controller.js";
import {authenticateToken} from "../../middleware/auth.js";
import commentRoute from "../comment.route.js";

// mergeParams lets this router read /:username from the parent mount point
const router = express.Router({ mergeParams: true });

// This handles: GET /api/v1/profile/:username/posts
router.get("/", profilePostsController);
router.use(authenticateToken);
router.put("/:id", profilePostEditController);
router.delete("/:id", profilePostDeleteController);
router.use("/:id/comment", commentRoute);
export default router;