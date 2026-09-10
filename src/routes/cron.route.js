import express from "express";
import { ENV } from "../../env.js";
import { purgeExpiredReadsController } from "../controllers/actions.controller.js";

const router = express.Router();

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` with every scheduled request.
// Reject everything else so this maintenance endpoint can't be triggered publicly.
router.use((req, res, next) => {
    if (!ENV.CRON_SECRET || req.headers.authorization !== `Bearer ${ENV.CRON_SECRET}`) {
        return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }
    next();
});

// GET /api/v1/cron/purge-actions
// Permanently deletes notifications ("actions") read more than 14 days ago.
router.get("/purge-actions", purgeExpiredReadsController);

export default router;
