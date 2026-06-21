import express from "express";
import {
    getTwoFollowing,
    getUserAbout,
    getUserEarnedMoney, getUserIntro,
    setSocialMedia,
    setUserAbout
} from "../../controllers/profile.controller.js";
import {validate} from "../../middleware/validate.js";
import {getIntroQuerySchema, socialSchema, updateAboutSchema} from "../../validations/profile.validation.js";


const router = express.Router({mergeParams: true});

// Target: GET /api/v1/profile/:username/intro/
router.get("/", validate(getIntroQuerySchema), getUserIntro);

// Target: GET /api/v1/profile/:username/intro/earnings
router.get("/earnings", validate(getIntroQuerySchema), getUserEarnedMoney);

// Target: GET /api/v1/profile/:username/intro/about
router.get("/about", getUserAbout);

// Target: GET /api/v1/profile/:username/intro/follow
router.get("/follow", getTwoFollowing);

// Target: PUT /api/v1/profile/:username/intro/about
router.put("/about", validate(updateAboutSchema), setUserAbout);

// Target: PUT /api/v1/profile/:username/intro/socials
router.put("/socials", validate(socialSchema), setSocialMedia);

export default router;