import express from "express";
import { getUserSettings, userSettingsController } from "../controllers/settings.controller.js";
import { validate } from "../middleware/validate.js";
import { settingsSchema } from "../validations/settings.validation.js";
import {authenticateToken} from "../middleware/auth.js";
import {resolveUserById} from "../middleware/resolveUser.js";

const router = express.Router();

// Chain them globally for all settings actions
router.use(authenticateToken);
router.use(resolveUserById);

// Now your controllers will safely have access to req.resolvedUser!
router.get("/", getUserSettings);
router.patch("/", validate(settingsSchema), userSettingsController);

export default router;