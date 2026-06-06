import express from "express";
import {getIntroDashboard} from "../../services/profile.service.js";
import {getIntroSchema} from "../../validations/profile.validation.js";
import {validate} from "../../middleware/validate.js";
const router = express.Router();

/**
 * Fetch all brief intro information about a user profile
 * GET /api/v1/profile/intro?username=someuser&earningTimeline=30&isFollower=true
 */
router.get("/", validate(getIntroSchema), async (req, res, next) => {
    try {
        // Zod has already validated username and transformed timeline/isFollower for us!
        const { username, earningTimeline, isFollower } = req.query;

        const introDashboardData = await getIntroDashboard(username, earningTimeline, isFollower);

        return res.status(200).json(introDashboardData);
    } catch (e) {
        next(e);
    }
});

export default router;