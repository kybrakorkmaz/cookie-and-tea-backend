import express from "express";
import {
    getUserPanel, previewCommentsController, profilePostsController,
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

const router = express.Router();

// Parameter Resolver
router.param("username", resolveGlobalUsername);

// Session Shield
router.use(authenticateToken);

// Tab 1: Profile Intro (Main tab)
router.use("/:username/intro", profileIntroRouter);

// Tab 2: Profile Media Gallery
router.use("/:username/tab=gallery", profileGalleryRouter);

// Tab 3: User's own posts on the profile
// This handles: GET /api/v1/profile/:username/posts
router.get("/:username/tab=posts",  profilePostsController);
router.use("/:username/posts", postsRoute);

router.get("/:username/tab=posts/preview", previewCommentsController)

// Generic Catch-all Parameter (MUST BE LAST)
// If the URL is just "/alice", it doesn't match the specific sub-routes or /posts, so it lands here safely.
router.get("/:username", validate(getProfileParamsSchema), getUserPanel);
export default router;