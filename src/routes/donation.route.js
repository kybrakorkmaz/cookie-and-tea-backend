import express from "express";
import {authenticateToken} from "../middleware/auth.js";
import {validate} from "../middleware/validate.js";
import {
    controllerConnectStripe,
    controllerDonationHistory,
    controllerStripeConnectionStatus,
    controllerTipCookie,
    controllerTipCookieTea,
    controllerTipTea
} from "../controllers/donation.controller.js";
import {donationSchema} from "../validations/donation.validation.js";

const router = express.Router();
router.use(authenticateToken);
// Stripe Connect Setup Routes
router.get("/connect/status", controllerStripeConnectionStatus);
router.post("/connect", controllerConnectStripe);
router.get("/history", controllerDonationHistory);

// Tier Tipping Routes
router.post("/tip-tea", validate(donationSchema), controllerTipTea);
router.post("/tip-cookie", validate(donationSchema), controllerTipCookie);
router.post("/tip-cookie-tea", validate(donationSchema), controllerTipCookieTea);

export default router;