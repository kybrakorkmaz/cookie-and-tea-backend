import {
    completeDonation, findDonations,
    getCardConnectionStatus,
    getDonationHistory,
    getSubMerchantConnectionStatus,
    initiateSubMerchantOnboarding,
    processDonation,
    saveDonatorCard,
} from "../services/donation.service.js";
export const controllerAllDonations = async (req, res, next) => {
    try {
        const { postId } = req.params;

        const { limit, offset } = req.query;

        const paginatedDonations = await findDonations(postId, limit, offset);

        return res.status(200).json({
            status: "success",
            data: paginatedDonations
        });
    } catch (e) {
        next(e);
    }
};
// Helper to safely escape JSON payloads intended for injection inside inline HTML <script> blocks
const escapeJsonForScript = (obj) => {
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
};

// 1. ADIM: Iframe içinde çalışacak sahte banka onay sayfası (HTML -> Base64)
const generateMock3DPage = (amount, recipient) => {
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
        <h3 style="margin-bottom: 5px;">🛡️ Iyzico Simulator</h3>
        <p style="font-size: 12px; color: #6b7280; margin-top: 0;">Secure 3D Payment</p>
        <div class="card">
            <p style="font-size: 14px; color: #4b5563;">Amount</p>
            <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 5px 0;">$${amount}</p>
            <p style="font-size: 13px; color: #6b7280;">To: <b>@${recipient}</b></p>
        </div>
        <button class="btn" onclick="approvePayment()">Confirm Simulation Payment</button>

        <script>
            function approvePayment() {
                // Frontend'deki IyzicoConfirm modalının handleMessage event'ini tetikler
                window.parent.postMessage({
                    type: "iyzico-donation-result",
                    success: true,
                    result: { amount: ${amount}, recipient: "${recipient}" }
                }, "*");
            }
        </script>
    </body>
    </html>`;
    return Buffer.from(html).toString('base64');
};

/**
 * Tokenizes the authenticated user's card via Iyzico ("connect card").
 */
export const controllerSaveCard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const card = await saveDonatorCard(userId, req.body);
        return res.status(200).json({ status: "success", data: card });
    } catch (error) {
        next(error);
    }
};

/**
 * Returns whether the authenticated user already tokenized a card with Iyzico
 */
export const controllerCardConnectionStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const status = await getCardConnectionStatus(userId);
        return res.status(200).json({ status: "success", data: status });
    } catch (error) {
        next(error);
    }
};

/**
 * Onboards the authenticated user as an Iyzico sub-merchant, so they can receive donations
 */
export const controllerConnectSubMerchant = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await initiateSubMerchantOnboarding(userId, req.body);
        return res.status(200).json({ status: "success", data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Returns whether the authenticated user's Iyzico sub-merchant account is connected
 */
export const controllerSubMerchantConnectionStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const status = await getSubMerchantConnectionStatus(userId);
        return res.status(200).json({ status: "success", data: status });
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
        return res.status(200).json({ status: "success", data: history });
    } catch (error) {
        next(error);
    }
};

/**
 * Tip Tea Controller - $5 donation
 */
export const controllerTipTea = async (req, res, next) => {
    try {
        const donatorId = req.user.id;
        const { recipientUsername, postId } = req.body;

        const result = await processDonation(donatorId, recipientUsername, 5, postId);
        return res.status(200).json({ status: "success", data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Tip Cookie Controller - $7 donation
 */
export const controllerTipCookie = async (req, res, next) => {
    try {
        const donatorId = req.user.id;
        const { recipientUsername, postId } = req.body;

        const result = await processDonation(donatorId, recipientUsername, 7, postId);
        return res.status(200).json({ status: "success", data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Tip Cookie+Tea Controller - $12 donation
 */
export const controllerTipCookieTea = async (req, res, next) => {
    try {
        const donatorId = req.user.id;
        const { recipientUsername, postId } = req.body;

        const result = await processDonation(donatorId, recipientUsername, 12, postId);
        return res.status(200).json({ status: "success", data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Iyzico 3D Secure postback callback
 */
export const controllerDonationCallback = async (req, res, next) => {
    try {
        const result = await completeDonation(req.body);
        const safePayload = escapeJsonForScript({ type: "iyzico-donation-result", success: true, result });

        return res.status(200).send(`<!DOCTYPE html><html><body><script>
            window.parent && window.parent.postMessage(${safePayload}, "*");
        </script></body></html>`);
    } catch (error) {
        const safeErrorPayload = escapeJsonForScript({ type: "iyzico-donation-result", success: false, message: error.message });

        return res.status(error.statusCode || 400).send(`<!DOCTYPE html><html><body><script>
            window.parent && window.parent.postMessage(${safeErrorPayload}, "*");
        </script></body></html>`);
    }
};