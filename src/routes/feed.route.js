import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {resolveGlobalUsername, resolveUserById} from "../middleware/resolveUser.js";
import { validate } from "../middleware/validate.js";
import { postSchema } from "../validations/post.validation.js";
import {
    createPostController,
    getFeedTimelineController,
} from "../controllers/feed.controller.js";
import {uploadMiddleware} from "../middleware/multer.middleware.js";
import {validateMediaCount} from "../middleware/fileValidator.middleware.js";
import postsRoute from "./posts.route.js";
import {allCommentsController, previewCommentsController} from "../controllers/comment.controller.js";
const router = express.Router();

// Parameter Resolver
router.param("username", resolveGlobalUsername);

// Public routes
//router.get("/post/:id", getPostController);

// Protected routes: Must be logged in to create, alter, or remove content
router.use(authenticateToken);
router.use(resolveUserById); // Injects req.resolvedUser (the viewer)

// Timeline of posts from people the viewer follows
router.get("/:username", getFeedTimelineController);
// USER ONLY CREATE A NEW POST ON FEED PAGE
router.post(
    "/:username",
    uploadMiddleware, // 1. Parse multipart (populates req.body AND req.files)
    validate(postSchema), // 2. Validate now that req.body exists
    validateMediaCount, // 3. Validate File Counts/Size
    createPostController // 4. Save to DB
);

router.use("/:username/posts", postsRoute);
router.get("/:username/preview", previewCommentsController);
router.get("/:username/comments", allCommentsController);
export default router;