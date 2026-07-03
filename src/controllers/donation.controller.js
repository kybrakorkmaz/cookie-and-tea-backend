import {
    getDonationHistory,
    getStripeConnectionStatus,
    initiateStripeOnboarding,
    processDonation,
} from "../services/donation.service.js";


/**
 * Onboard/Connect Stripe Account Link Generator
 */
export const controllerConnectStripe = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const onboardingUrl = await initiateStripeOnboarding(userId);

        return res.status(200).json({
            status: "success",
            data: { url: onboardingUrl }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Returns whether the authenticated user's Stripe account is connected and ready for card payments
 */
export const controllerStripeConnectionStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const status = await getStripeConnectionStatus(userId);

        return res.status(200).json({
            status: "success",
            data: status,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Returns donation history for the authenticated user (donations received)
 */
export const controllerDonationHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const history = await getDonationHistory(userId);

        return res.status(200).json({
            status: "success",
            data: history,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Tip Tea Controller - $5 donation
 * Processes a $5 tip/donation from authenticated user to specified recipient
 */
export const controllerTipTea = async (req, res, next) => {
    try {
        const donatorId = req.user.id;
        const { recipientUsername } = req.body;

        // Process $5 donation
        const result = await processDonation(donatorId, recipientUsername, 5);

        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Tip Cookie Controller - $7 donation
 * Processes a $7 tip/donation from authenticated user to specified recipient
 */
export const controllerTipCookie = async (req, res, next) => {
    try {
        const donatorId = req.user.id;
        const { recipientUsername } = req.body;

        // Process $7 donation
        const result = await processDonation(donatorId, recipientUsername, 7);

        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Tip Cookie+Tea Controller - $12 donation
 * Processes a $12 tip/donation from authenticated user to specified recipient
 */
export const controllerTipCookieTea = async (req, res, next) => {
    try {
        const donatorId = req.user.id;
        const { recipientUsername } = req.body;

        // Process $12 donation
        const result = await processDonation(donatorId, recipientUsername, 12);

        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};