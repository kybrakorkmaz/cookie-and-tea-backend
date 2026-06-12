import express from "express";
import {
    getTwoFollowing,
    getUserAbout,
    getUserEarnedMoney,
    getUserGallery,
    getUserIntro,
    getUserPanel, setSocialMedia, setUserAbout
} from "../../controllers/profile.controller.js";
import {validate} from "../../middleware/validate.js";
import {
    getIntroQuerySchema,
    getProfileParamsSchema, socialSchema, updateAboutSchema,
} from "../../validations/profile.validation.js";
import {authenticateToken} from "../../middleware/auth.js";

const router = express.Router();

//  Top-Level Guard
// all router are under this line are guarded by authenticateToken (cookie session)
router.use(authenticateToken);
// Sub-Resources (First)
router.get("/:username/intro", validate(getIntroQuerySchema), getUserIntro);
router.get("/:username/earnings", getUserEarnedMoney); // Isolated target metric endpoint todo validation
router.get("/:username/about", getUserAbout);
router.get("/:username/follow", getTwoFollowing);
// Intercepting mutations with clean schema guards
router.put("/:username/about", validate(updateAboutSchema), setUserAbout);
router.put("/:username/socials", validate(socialSchema), setSocialMedia);


// router.get("/:username/gallery", validate(getProfileParamsSchema), getUserGallery);

/*
// Stack them in order: Authed? -> Valid Data? -> Execute Controller
router.put(
    "/profile",
    authenticateToken,          // 1. Checks who they are
    validate(updateProfileSchema), // 2. Checks if their inputs are correct
    updateProfileController     // 3. Runs the database action
);
 */
// Generic Catch-all Parameter (Last)
// If the URL is just "/alice", it doesn't match sub-routes, so it drops down here safely.
router.get("/:username", validate(getProfileParamsSchema), getUserPanel);
// GET /api/v1/profile/kubra/gallery
//router.get("/:username/gallery", validate(getProfileParamsSchema), getUserGallery);

export default router;