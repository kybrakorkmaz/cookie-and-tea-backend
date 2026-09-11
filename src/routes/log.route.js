import express from "express";
import { logger } from "../lib/logger.js";

const router = express.Router();

const ALLOWED_LEVELS = new Set(["error", "warn", "info"]);

// POST /api/v1/logs/client
// Browser-originated log events, re-logged through winston so frontend errors
// surface in Vercel Runtime Logs alongside API logs. Open by design (login and
// env failures happen pre-auth) but sanitized: fixed level set, truncated
// message, nothing persisted beyond the log stream.
router.post("/client", (req, res) => {
    const { level, message, meta } = req.body ?? {};

    const safeMessage = String(message ?? "").slice(0, 500);
    if (!safeMessage) {
        return res.status(400).json({ status: "fail", message: "message is required" });
    }

    const safeLevel = ALLOWED_LEVELS.has(level) ? level : "info";

    logger[safeLevel](`[client] ${safeMessage}`, {
        clientMeta: meta,
        userAgent: req.headers["user-agent"],
    });

    return res.status(204).end();
});

export default router;
