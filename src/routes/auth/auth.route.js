import express from "express";
import {signUpController, verifyEmailController} from "../../controllers/auth.controller.js";
import {registerUserSchema} from "../../validations/auth.validation.js";
import {validate} from "../../middleware/validate.js";

const router = express.Router();

router.post("/sign-up", validate(registerUserSchema), signUpController);
router.get("/verify-email", verifyEmailController);

export default router;