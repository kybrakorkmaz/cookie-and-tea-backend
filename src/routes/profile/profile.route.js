import express from "express";
import {
    getUserPanel,  profilePostsController,
} from "../../controllers/profile.controller.js";
import {validate} from "../../middleware/validate.js";
import {
    getProfileParamsSchema,
} from "../../validations/profile.validation.js";
import {authenticateToken} from "../../middleware/auth.js";
import {resolveGlobalUsername} from "../../middleware/resolveUser.js";
import profileIntroRouter from "./intro.route.js";
import profileGalleryRouter from "./gallery.route.js";
import postsRoute from "../posts.route.js";
import {previewCommentsController} from "../../controllers/comment.controller.js";

const router = express.Router();

// Parameter Resolver
router.param("username", resolveGlobalUsername);

// Session Shield
router.use(authenticateToken);

// Tab 1: Profile Intro (Main tab)
router.use("/:username/intro", profileIntroRouter);

// Tab 2: Profile Media Gallery
router.use("/:username/gallery", profileGalleryRouter);

// Tab 3: User's own posts on the profile
// This handles: GET /api/v1/profile/:username/posts
router.get("/:username/posts", profilePostsController);
// Handles nested modification actions (PUT /:id, DELETE /:id) via your postsRoute
router.use("/:username/posts", postsRoute);

// Handles post comment previews: GET /api/v1/profile/:username/posts/preview
router.get("/:username/posts/preview", previewCommentsController);

// Generic Catch-all Parameter (MUST BE LAST)
// If the URL is just "/alice", it doesn't match the specific sub-routes or /posts, so it lands here safely.
router.get("/:username", validate(getProfileParamsSchema), getUserPanel);
export default router;