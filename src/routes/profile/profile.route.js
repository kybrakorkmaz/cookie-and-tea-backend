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

const router = express.Router();

// Sub-Resources (First)
router.get("/:username/intro", validate(getIntroQuerySchema), getUserIntro);
router.get("/:username/earnings", getUserEarnedMoney); // Isolated target metric endpoint todo validation
router.get("/:username/about", getUserAbout);
router.get("/:username/follow", getTwoFollowing);
// Intercepting mutations with clean schema guards
router.put("/:username/about", validate(updateAboutSchema), setUserAbout);
router.put("/:username/socials", validate(socialSchema), setSocialMedia);


// router.get("/:username/gallery", validate(getProfileParamsSchema), getUserGallery);


// Generic Catch-all Parameter (Last)
// If the URL is just "/alice", it doesn't match sub-routes, so it drops down here safely.
router.get("/:username", validate(getProfileParamsSchema), getUserPanel);
// GET /api/v1/profile/kubra/gallery
//router.get("/:username/gallery", validate(getProfileParamsSchema), getUserGallery);

export default router;