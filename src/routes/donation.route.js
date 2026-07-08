import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
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
import { cardSchema, donationSchema, allDonationsSchema } from "../validations/donation.validation.js";

const router = express.Router({ mergeParams: true });

// PUBLIC INTERFACE: Iyzico posts back here natively from its external web context.
// No application header authorization tokens will be present on this inbound webhook.
router.post(
    "/callback",
    express.urlencoded({ extended: true }),
    controllerDonationCallback
);

// --- PROTECTED GATEWAY ---
// Intercepts downstream traffic to prevent data scraping and protect donor privacy
router.use(authenticateToken);

// SECURED: Moved below authenticateToken to block anonymous access to donor PII
router.get("/", validate(allDonationsSchema), controllerAllDonations);

// Card Connection & Tipping Routes
router.get("/card/status", controllerCardConnectionStatus);
router.post("/card", validate(cardSchema), controllerSaveCard);
router.get("/connect/status", controllerSubMerchantConnectionStatus);
router.post("/connect", controllerConnectSubMerchant);
router.get("/history", controllerDonationHistory);

// Tier Tipping Routes
router.post("/tip-tea", validate(donationSchema), controllerTipTea);
router.post("/tip-cookie", validate(donationSchema), controllerTipCookie);
router.post("/tip-cookie-tea", validate(donationSchema), controllerTipCookieTea);

export default router;