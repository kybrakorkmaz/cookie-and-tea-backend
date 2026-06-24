import express from "express";
import {
    getMeController,
    loginController,
    logoutController,
    signUpController,
    verifyEmailController
} from "../../controllers/auth.controller.js";
import {loginUserSchema, registerUserSchema} from "../../validations/auth.validation.js";
import {validate} from "../../middleware/validate.js";
import {authenticateToken} from "../../middleware/auth.js";

const router = express.Router();

router.post("/sign-up", validate(registerUserSchema), signUpController);
router.post("/login", validate(loginUserSchema), loginController);
router.get("/me", authenticateToken, getMeController);
router.post("/logout", logoutController);

router.get("/verify-email", verifyEmailController);

export default router;