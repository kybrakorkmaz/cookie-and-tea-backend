import { ENV } from "../../env.js";
import { stripe } from "../config/stripe.js";
import {
    createDonation,
    getUserByUsername,
    getUserById,
    getDonationsByUser,
    updateUserStripeId,
} from "../repositories/donation.repository.js";
import { notifyDonation } from "./actions.service.js";

/**
 * Initiates the Stripe Express Connect connection link for a user
 */
export const initiateStripeOnboarding = async (userId) => {
    const userResult = await getUserById(userId);
    if (!userResult || userResult.length === 0) {
        const error = new Error("User profile not found");
        error.statusCode = 404;
        throw error;
    }

    let stripeConnectId = userResult[0].stripeConnectId;

    // Step A: If they don't have a Stripe Connect Account, provision one now
    if (!stripeConnectId) {
        const account = await stripe.accounts.create({
            type: "express",
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: "individual",
        });

        stripeConnectId = account.id;
        // Save ID immediately to DB
        await updateUserStripeId(userId, stripeConnectId);
    }

    // Step B: Create an ephemeral Account Link for frontend redirection onboarding
    const accountLink = await stripe.accountLinks.create({
        account: stripeConnectId,
        refresh_url: `${ENV.BASE_URL}/stripe/reauth`, // Route handles failure retry loops
        return_url: `${ENV.BASE_URL}/stripe/success`, // Route handles success landings
        type: "account_onboarding",
    });

    return accountLink.url;
};

/**
 * Checks whether the user has a connected Stripe account that can receive card payments
 */
export const getStripeConnectionStatus = async (userId) => {
    const userResult = await getUserById(userId);
    if (!userResult || userResult.length === 0) {
        const error = new Error("User profile not found");
        error.statusCode = 404;
        throw error;
    }

    const user = userResult[0];

    if (!user.stripeConnectId) {
        return {
            connected: false,
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: false,
        };
    }

    const account = await stripe.accounts.retrieve(user.stripeConnectId);

    return {
        connected: account.charges_enabled && account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        stripeConnectId: user.stripeConnectId,
    };
};

export const processDonation = async (donatorId, recipientUsername, amountInDollars) => {
    // 1. Get recipient user info
    const recipientResult = await getUserByUsername(recipientUsername);
    if (!recipientResult || recipientResult.length === 0) {
        const error = new Error("Recipient user not found");
        error.statusCode = 404;
        throw error;
    }

    const recipient = recipientResult[0];

    // 2. Get donator user info
    const donatorResult = await getUserById(donatorId);
    if (!donatorResult || donatorResult.length === 0) {
        const error = new Error("Donator user not found");
        error.statusCode = 404;
        throw error;
    }

    const donator = donatorResult[0];

    if (donator.id === recipient.id) {
        const error = new Error("You cannot donate to yourself");
        error.statusCode = 400;
        throw error;
    }

    // 3. Check if both users have connected Stripe accounts
    if (!donator.stripeConnectId) {
        const error = new Error("Your Stripe account is not connected. Please connect your account first.");
        error.statusCode = 400;
        throw error;
    }

    if (!recipient.stripeConnectId) {
        const error = new Error("Recipient's Stripe account is not connected. They cannot receive donations.");
        error.statusCode = 400;
        throw error;
    }

    // 4. Convert dollars to cents for Stripe
    const amountInCents = Math.round(amountInDollars * 100);

    // 5. Create a payment intent with Stripe Connect
    try {
        const paymentIntent = await stripe.paymentIntents.create(
            {
                amount: amountInCents,
                currency: "usd",
                payment_method_types: ["card"],
                // The donation goes to the recipient's Stripe Connect account
                // We take a small fee (for example, 5%)
                application_fee_amount: Math.round(amountInCents * 0.05),
            },
            {
                stripeAccount: recipient.stripeConnectId,
            }
        );

        // 6. Create donation record in database
        const donation = await createDonation(
            donatorId,
            recipient.id,
            amountInCents
        );

        await notifyDonation({
            actorId: donatorId,
            targetUserId: recipient.id,
            amount: amountInCents,
        });

        return {
            success: true,
            donation: donation[0],
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            amount: amountInDollars,
            recipient: recipient.name,
        };
    } catch (error) {
        const err = new Error(`Payment processing failed: ${error.message}`);
        err.statusCode = 400;
        throw err;
    }
};

export const getDonationHistory = async (userId) => {
    const donations = await getDonationsByUser(userId);

    return donations.map((donation) => ({
        id: donation.id,
        amount: donation.amount,
        amountDollars: donation.amount / 100,
        postId: donation.postId,
        createdAt: donation.createdAt,
        donator: {
            id: donation.donatorId,
            name: donation.donatorName,
            username: donation.donatorUsername,
        },
        status: "paid",
    }));
};

export const connectStripeAccount = async (userId, stripeConnectId) => {
    try {
        const result = await updateUserStripeId(userId, stripeConnectId);
        return result[0];
    } catch (error) {
        const err = new Error("Failed to connect Stripe account");
        err.statusCode = 500;
        throw err;
    }
};
