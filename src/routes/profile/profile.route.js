import express from "express";
import {
    getUserPanel,
} from "../../controllers/profile.controller.js";
import {validate} from "../../middleware/validate.js";
import {
    getProfileParamsSchema,
} from "../../validations/profile.validation.js";
import {authenticateToken} from "../../middleware/auth.js";
import {resolveGlobalUsername} from "../../middleware/resolveUser.js";

import profilePostsRouter from "./posts.route.js"
import profileIntroRouter from "./intro.route.js";
import profileGalleryRouter from "./gallery.route.js";

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
router.use("/:username/posts", profilePostsRouter);

// Generic Catch-all Parameter (MUST BE LAST)
// If the URL is just "/alice", it doesn't match the specific sub-routes or /posts, so it lands here safely.
router.get("/:username", validate(getProfileParamsSchema), getUserPanel);

export default router;