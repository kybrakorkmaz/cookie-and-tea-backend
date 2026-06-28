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
router.put("/:id", uploadMiddleware, validate(postSchema), updatePostController);
// Delete a post
router.delete("/:id", deletePostController);

// Mount comments logic under this post
router.use("/:id/comment", commentRoute);
export default router;