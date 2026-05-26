import express from "express";
import {getIntroDashboard} from "../../services/profile.service.js";
const router = express.Router();

/**
 * Fetch all brief intro information about a user profile
 * GET /api/v1/profile/intro?username=someuser&earningTimeline=30&isFollower=true
 */
router.get("/", async (req, res, next) => {
    try {
        // 1. Safely extract and validate the username parameter
        const username = typeof req.query.username === "string" ? req.query.username.trim() : "";
        if (!username) {
            const badRequest = new Error("Username query parameter is required");
            badRequest.statusCode = 400;
            throw badRequest;
        }

        // 2. Safely parse the timeline (e.g., 30, 90, 365)
        const timelineInput = Number(req.query.earningTimeline);
        const daysLimit = Number.isInteger(timelineInput) && timelineInput > 0 ? timelineInput : 30;

        // 3. Parse the relationship flag (Defaults to true, becomes false if string "false" is passed)
        const isFollowerView = req.query.isFollower !== "false";

        // 4. Delegate orchestration entirely to the Service Layer
        // This single call resolves the User ID, fetches about info, socials, aggregates earnings,
        // queries top posts, and executes the inner-joined follower/following query in parallel.
        const introDashboardData = await getIntroDashboard(username, daysLimit, isFollowerView);

        // 5. Return the clean response object directly to the client
        return res.status(200).json(introDashboardData);

    } catch (e) {
        // 6. Any error thrown inside the controller or bubbled up from the
        // service/repositories layer lands here and drops cleanly into your errorHandler.
        next(e);
    }
});

export default router;