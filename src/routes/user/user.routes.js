import express from "express";
import {validate} from "../../middleware/validate.js";
import {CreateUserSchema} from "../../validations/auth.validation.js";
import {registerUser} from "../../controllers/user.controller.js";

const router = express.Router();

// Functional pipeline: Validate first, then hit the controller logic
router.post("/register", validate(CreateUserSchema), registerUser);

export default router;