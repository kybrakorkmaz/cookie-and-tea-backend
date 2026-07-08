import express from "express";
import {authenticateToken} from "../middleware/auth.js";
import {validate} from "../middleware/validate.js";
import {
    controllerAllDonations,
    controllerCardConnectionStatus,
    controllerConnectSubMerchant,
    controllerDonationCallback,
    controllerDonationHistory,
    controllerSaveCard,
    controllerSubMerchantConnectionStatus,
    controllerTipCookie,
    controllerTipCookieTea,
    controllerTipTea
} from "../controllers/donation.controller.js";
import {cardSchema, donationSchema} from "../validations/donation.validation.js";

const router = express.Router({ mergeParams: true });
router.get("/", controllerAllDonations);

// Public route: iyzico posts back here after the user confirms on iyzico's own
// 3D Secure confirmation page, no auth token is available on that request.
router.post(
    "/callback",
    express.urlencoded({ extended: true }), // Essential for parsing iyzico's incoming form data
    controllerDonationCallback
);

router.use(authenticateToken);

// Iyzico card tokenization ("connect card") routes - donator enters card details once
router.get("/card/status", controllerCardConnectionStatus);
router.post("/card", validate(cardSchema), controllerSaveCard);

// Iyzico sub-merchant onboarding routes - recipient connects to be able to receive donations
router.get("/connect/status", controllerSubMerchantConnectionStatus);
router.post("/connect", controllerConnectSubMerchant);

router.get("/history", controllerDonationHistory);

// Tier Tipping Routes
router.post("/tip-tea", validate(donationSchema), controllerTipTea);
router.post("/tip-cookie", validate(donationSchema), controllerTipCookie);
router.post("/tip-cookie-tea", validate(donationSchema), controllerTipCookieTea);

export default router;
