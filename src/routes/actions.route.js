import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { resolveUserById } from "../middleware/resolveUser.js";
import {
    getActionsController,
    markActionReadController,
    deleteActionController,
} from "../controllers/actions.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.use(resolveUserById);

// GET: /api/v1/actions
router.get("/", getActionsController);

// PUT: /api/v1/actions/:id/read
router.put("/:id/read", markActionReadController);

// DELETE: /api/v1/actions/:id
// Deletes the notification permanently for the requesting user.
// This only removes the notification entry, the underlying transaction (e.g. donation) is preserved.
router.delete("/:id", deleteActionController);

// NOTE: global purge lives ONLY on /api/v1/cron/purge-actions behind CRON_SECRET —
// it must not be triggerable by any authenticated user here.

export default router;