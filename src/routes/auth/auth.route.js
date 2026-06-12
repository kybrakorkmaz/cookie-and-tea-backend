import express from "express";
import {
    loginController,
    logoutController,
    signUpController,
    verifyEmailController
} from "../../controllers/auth.controller.js";
import {loginUserSchema, registerUserSchema} from "../../validations/auth.validation.js";
import {validate} from "../../middleware/validate.js";

const router = express.Router();

router.post("/sign-up", validate(registerUserSchema), signUpController);
router.post("/login", validate(loginUserSchema), loginController);
router.post("/logout", logoutController);

router.get("/verify-email", verifyEmailController);

export default router;