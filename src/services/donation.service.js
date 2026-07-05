import crypto from "crypto";
import { ENV } from "../../env.js";
import { iyzico } from "../config/iyzico.js";
import {
    createDonation,
    getUserByUsername,
    getUserById,
    getDonationsByUser,
    updateUserSubMerchantKey,
    updateUserCard,
} from "../repositories/donation.repository.js";
import { notifyDonation } from "./actions.service.js";

const pendingDonations = new Map();

const promisify = (fn, request) =>
    new Promise((resolve, reject) => {
        fn(request, (err, result) => {
            if (err) return reject(err);
            if (result?.status !== "success") {
                const apiError = new Error(result?.errorMessage || "Iyzico gateway request failed");
                apiError.statusCode = 400;
                return reject(apiError);
            }
            resolve(result);
        });
    });

const getExistingUserOrThrow = async (userId, customMessage = "User profile not found") => {
    const userResult = await getUserById(userId);
    if (!userResult || userResult.length === 0) {
        const error = new Error(customMessage);
        error.statusCode = 404;
        throw error;
    }
    return userResult[0];
};

const parseContactNames = (fullName, fallback) => {
    const cleaned = fullName?.trim() || "";
    if (!cleaned) return { firstName: fallback, lastName: fallback };
    const parts = cleaned.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: fallback };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

// HTML generator simulating Iyzico 3D Secure UI.
// It posts urlencoded data to the production callback endpoint.
const generateMock3DPage = (conversationId, amount, recipientName) => {
    const html = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 30px 15px; color: #1f2937; background: #ffffff; }
            .card { background: #f9fafb; border: 1px dashed #e5e7eb; padding: 20px; border-radius: 16px; max-width: 280px; margin: 0 auto 20px; }
            .btn { background: #d97706; color: white; border: none; padding: 12px 24px; font-weight: bold; border-radius: 12px; cursor: pointer; width: 100%; font-size: 15px; transition: opacity 0.2s; }
            .btn:hover { opacity: 0.9; }
            p { margin: 8px 0; }
        </style>
    </head>
    <body>
        <h3 style="margin-bottom: 5px;">🛡️ Iyzico Simulator (Sandbox Bypass)</h3>
        <p style="font-size: 12px; color: #6b7280; margin-top: 0;">Secure 3D Secure Gateway</p>
        <div class="card">
            <p style="font-size: 14px; color: #4b5563;">Amount</p>
            <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 5px 0;">$${amount}</p>
            <p style="font-size: 13px; color: #6b7280;">To: <b>@${recipientName}</b></p>
        </div>
        
        <form action="${ENV.BASE_URL}/api/v1/donate/callback" method="POST">
            <input type="hidden" name="conversationId" value="${conversationId}">
            <input type="hidden" name="status" value="success">
            <input type="hidden" name="mdStatus" value="1">
            <input type="hidden" name="paymentId" value="mock_payment_${Date.now()}">
            <button type="submit" class="btn">Confirm Simulation Payment</button>
        </form>
    </body>
    </html>`;
    return Buffer.from(html).toString('base64');
};

export const saveDonatorCard = async (userId, cardDetails) => {
    const user = await getExistingUserOrThrow(userId);
    const request = {
        locale: "en",
        conversationId: `card-${userId}-${Date.now()}`,
        email: user.email,
        externalId: String(user.id),
        card: {
            cardAlias: "Donation Card",
            cardHolderName: cardDetails.cardHolderName,
            cardNumber: cardDetails.cardNumber,
            expireYear: cardDetails.expireYear,
            expireMonth: cardDetails.expireMonth,
        },
    };
    if (user.iyzicoCardUserKey) {
        request.cardUserKey = user.iyzicoCardUserKey;
    }
    const result = await promisify(iyzico.card.create.bind(iyzico.card), request);
    await updateUserCard(userId, { iyzicoCardUserKey: result.cardUserKey, iyzicoCardToken: result.cardToken });
    return { cardUserKey: result.cardUserKey, cardLastFourDigits: result.lastFourDigits, cardAssociation: result.cardAssociation, cardFamily: result.cardFamily };
};

export const getCardConnectionStatus = async (userId) => {
    const user = await getExistingUserOrThrow(userId);
    return { connected: Boolean(user.iyzicoCardUserKey && user.iyzicoCardToken) };
};

export const initiateSubMerchantOnboarding = async (userId, merchantDetails = {}) => {
    const user = await getExistingUserOrThrow(userId);
    if (user.iyzicoSubMerchantKey) {
        return { subMerchantKey: user.iyzicoSubMerchantKey };
    }
    const { gsmNumber, identityNumber, iban, address } = merchantDetails;
    if (!gsmNumber || !identityNumber || !iban) {
        const validationError = new Error("Missing mandatory bank details.");
        validationError.statusCode = 400;
        throw validationError;
    }
    if (process.env.MOCK_IYZICO === "true" || ENV.MOCK_IYZICO === "true") {
        const mockSubMerchantKey = `mock_submerchant_${userId}_${Date.now()}`;
        await updateUserSubMerchantKey(userId, mockSubMerchantKey);
        return { subMerchantKey: mockSubMerchantKey, note: "Development Mode Bypass" };
    }
    const { firstName, lastName } = parseContactNames(user.name, user.username);
    const request = {
        locale: "en",
        conversationId: `submerchant-${userId}-${Date.now()}`,
        subMerchantExternalId: String(user.id),
        subMerchantType: "PERSONAL",
        name: user.name || user.username,
        contactName: firstName,
        contactSurname: lastName,
        email: user.email,
        gsmNumber,
        identityNumber,
        iban,
        address: address || "N/A",
        currency: "TRY",
    };
    const result = await promisify(iyzico.subMerchant.create.bind(iyzico.subMerchant), request);
    await updateUserSubMerchantKey(userId, result.subMerchantKey);
    return { subMerchantKey: result.subMerchantKey };
};

export const getSubMerchantConnectionStatus = async (userId) => {
    const user = await getExistingUserOrThrow(userId);
    return { connected: Boolean(user.iyzicoSubMerchantKey) };
};

export const processDonation = async (donatorId, recipientUsername, amountInDollars, postId = null) => {
    const recipientResult = await getUserByUsername(recipientUsername);
    if (!recipientResult || recipientResult.length === 0) {
        const error = new Error("Recipient user not found");
        error.statusCode = 404;
        throw error;
    }
    const recipient = recipientResult[0];
    const donator = await getExistingUserOrThrow(donatorId, "Donator user not found");

    if (donator.id === recipient.id) {
        const error = new Error("You cannot donate to yourself");
        error.statusCode = 400;
        throw error;
    }
    if (!donator.iyzicoCardUserKey || !donator.iyzicoCardToken) {
        const error = new Error("Please save a card before donating.");
        error.statusCode = 400;
        throw error;
    }
    if (!recipient.iyzicoSubMerchantKey) {
        const error = new Error("Recipient cannot receive tips yet.");
        error.statusCode = 400;
        throw error;
    }

    const amountInCents = Math.round(amountInDollars * 100);
    const conversationId = crypto.randomUUID();
    const formattedPrice = amountInDollars.toFixed(2);
    const recipientName = recipient.name || recipient.username;

    // Save state to short-lived map for verification during callback stage
    pendingDonations.set(conversationId, {
        donatorId,
        recipientId: recipient.id,
        amountInCents,
        amountInDollars,
        recipientName,
        postId: postId || null,
    });

    // CRITICAL BYPASS CHECK FOR PORTFOLIO PROJECT
    if (process.env.MOCK_IYZICO === "true" || ENV.MOCK_IYZICO === "true") {
        return {
            success: true,
            requires3ds: true,
            conversationId,
            htmlContent: generateMock3DPage(conversationId, amountInDollars, recipientName),
        };
    }

    const { firstName, lastName } = parseContactNames(donator.name, donator.username);
    const request = {
        locale: "en",
        conversationId,
        price: formattedPrice,
        paidPrice: formattedPrice,
        currency: "USD",
        basketId: `donation-${donatorId}-${recipient.id}-${Date.now()}`,
        paymentGroup: "PRODUCT",
        callbackUrl: `${ENV.BASE_URL}/api/v1/donate/callback`,
        paymentCard: { cardUserKey: donator.iyzicoCardUserKey, cardToken: donator.iyzicoCardToken },
        buyer: { id: String(donator.id), name: firstName, surname: lastName, email: donator.email, identityNumber: "11111111111", registrationAddress: "N/A", ip: "127.0.0.1", city: "N/A", country: "N/A" },
        shippingAddress: { contactName: donator.name || donator.username, city: "N/A", country: "N/A", address: "N/A" },
        billingAddress: { contactName: donator.name || donator.username, city: "N/A", country: "N/A", address: "N/A" },
        basketItems: [{ id: `donation-tier-${amountInDollars}`, name: `Donation to @${recipient.username}`, category1: "Donation", itemType: "VIRTUAL", price: formattedPrice, subMerchantKey: recipient.iyzicoSubMerchantKey, subMerchantPrice: formattedPrice }],
    };

    try {
        const result = await promisify(iyzico.threedsInitialize.create.bind(iyzico.threedsInitialize), request);
        return { success: true, requires3ds: true, conversationId, htmlContent: result.threeDSHtmlContent };
    } catch (error) {
        pendingDonations.delete(conversationId);
        const err = new Error(`Payment initialization failed: ${error.message}`);
        err.statusCode = error.statusCode || 400;
        throw err;
    }
};

export const completeDonation = async (callbackBody) => {
    const { conversationId, status, mdStatus, paymentId } = callbackBody;

    const pending = pendingDonations.get(conversationId);
    if (!pending) {
        const error = new Error("Unknown or expired donation session");
        error.statusCode = 400;
        throw error;
    }
    pendingDonations.delete(conversationId);

    if (status !== "success" || !["1", "2", "3", "4"].includes(String(mdStatus))) {
        const error = new Error("3D Secure confirmation failed or was declined");
        error.statusCode = 400;
        throw error;
    }

    let dynamicPaymentId = paymentId;

    // CRITICAL BYPASS CHECK FOR PORTFOLIO PROJECT
    // Skip external API charge call if mock environment configuration is active
    if (process.env.MOCK_IYZICO !== "true" && ENV.MOCK_IYZICO !== "true") {
        const result = await promisify(iyzico.threedsPayment.create.bind(iyzico.threedsPayment), {
            locale: "en",
            conversationId,
            paymentId,
        });
        dynamicPaymentId = result.paymentId;
    }

    // NATIVE REGULAR PERSISTENCE LAYER EXECUTION
    // This executes regardless of real/mock configurations, saving entries to PostgreSQL via Drizzle Repository
    // Also increments the post's donation_sum counter (if the donation is tied to a post)
    const donation = await createDonation(
        pending.donatorId,
        pending.recipientId,
        pending.amountInCents,
        pending.postId
    );

    // Triggers notification signals natively so it shows up immediately for the recipient
    await notifyDonation({
        actorId: pending.donatorId,
        targetUserId: pending.recipientId,
        amount: pending.amountInCents,
        postId: pending.postId,
    });

    return {
        success: true,
        donation: donation[0],
        paymentId: dynamicPaymentId,
        amount: pending.amountInDollars,
        recipient: pending.recipientName,
    };
};

export const getDonationHistory = async (userId) => {
    const donations = await getDonationsByUser(userId);
    return donations.map((donation) => ({
        id: donation.id,
        amount: donation.amount,
        amountDollars: donation.amount / 100,
        postId: donation.postId,
        createdAt: donation.createdAt,
        donator: { id: donation.donatorId, name: donation.donatorName, username: donation.donatorUsername },
        status: "paid",
    }));
};