import express from "express";
import {authenticateToken} from "../middleware/auth.js";
import commentRoute from "./comment.route.js";
import {uploadMiddleware} from "../middleware/multer.middleware.js";
import {validate} from "../middleware/validate.js";
import {postSchema} from "../validations/post.validation.js";
import {deletePostController, updatePostController} from "../controllers/post.controller.js";

// mergeParams lets this router read /:username from the parent mount point
const router = express.Router({ mergeParams: true });
// All post modification routes require authentication
router.use(authenticateToken);

// Update a post
router.put(
    "/:id",
    uploadMiddleware,
    // 1. Stash the media fields before validation strips them
    (req, res, next) => {
        req._preservedMedia = {
            existingImages: req.body.existingImages,
            existingVideos: req.body.existingVideos
        };
        next();
    },
    // 2. Validate the standard fields (header, content, type)
    validate(postSchema),
    // 3. Merge the stashed media fields back into req.body
    (req, res, next) => {
        Object.assign(req.body, req._preservedMedia);
        next();
    },
    updatePostController
);

// Delete a post
router.delete("/:id", deletePostController);

// Mount comments logic under this post
router.use("/:id/comment", commentRoute);

export default router;