import { createNewUser, findUserByEmail, findUserByUsername, updateUserStatus } from "../repositories/auth.repository.js";
import jwt from "jsonwebtoken";
import { ENV } from "../../env.js";
import { sendEmail } from "../utils/email.util.js";
import { emailSchema } from "../validations/auth.validation.js";
import {hashPassword, verifyPassword} from "../utils/password.util.js";
import { logger } from "../lib/logger.js";

// audience separates token purposes: sessions ("cat-app-users") vs email
// verification ("cat-app-email") — one can never be replayed as the other
const generateToken = async (payload, audience = "cat-app-users") => {
    const jwtSecret = ENV.JWT_SECRET;
    const claims = {
        expiresIn: "1d",
        issuer: "cat-app",
        audience
    };
    return jwt.sign(payload, jwtSecret, claims);
}

// User-controlled values must be escaped before landing in HTML emails
const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Branded verification email — table layout + inline styles for email-client compatibility.
// Colors mirror the frontend palette (primary-dark #5E0006, cream #EED9B9);
// the CTA uses a deep vivid green (#15803d).
const buildVerificationEmailHtml = (name, verificationUrl) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#EED9B9;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EED9B9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#5E0006;padding:24px 32px;text-align:center;">
            <span style="color:#FFFFFF;font-size:24px;font-weight:bold;letter-spacing:1px;">Cookie and Tea</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;color:#5E0006;font-size:22px;">Welcome, ${escapeHtml(name)}!</h1>
            <p style="margin:0 0 24px;color:#333333;font-size:15px;line-height:1.6;">
              Thanks for signing up. Please confirm your email address to activate your account — this link expires in 24 hours.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center" style="padding-bottom:24px;">
                <a href="${verificationUrl}" style="display:inline-block;background-color:#15803d;color:#FFFFFF;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:12px;">Verify my account</a>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;color:#666666;font-size:13px;line-height:1.6;">Button not working? Paste this link into your browser:</p>
            <p style="margin:0;word-break:break-all;"><a href="${verificationUrl}" style="color:#9B0F06;font-size:13px;">${verificationUrl}</a></p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background-color:#FAF3E7;text-align:center;">
            <p style="margin:0;color:#999999;font-size:12px;">If you didn't create an account, you can safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const verifyUserToken = async (token) => {
    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET, {
            issuer: "cat-app",
            audience: "cat-app-email"
        });

        const updatedUser = await updateUserStatus(decoded.userId, "active");
        if (!updatedUser) {
            const error = new Error("User not found or activation failed");
            error.statusCode = 404;
            throw error;
        }
        return updatedUser;
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            const error = new Error("Verification link expired. Please sign up again.");
            error.statusCode = 400;
            throw error;
        }
        if (err.name === "JsonWebTokenError") {
            const error = new Error("Invalid verification link.");
            error.statusCode = 400;
            throw error;
        }
        throw err;
    }
}

const prepareUserResponse = (user) => {
    const { hashedPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

//  Added optional bypassVerification parameter to isolate test runs
export const registerNewUser = async (name, username, email, password, bypassVerification = false) => {
    try {
        // Proactively ensure username/email uniqueness before attempting insert
        const existingByEmail = await findUserByEmail(email);
        if (existingByEmail) {
            const error = new Error("Email address is already in use.");
            error.statusCode = 400;
            throw error;
        }

        const existingByUsername = await findUserByUsername(username);
        if (existingByUsername) {
            const error = new Error("Username is already taken.");
            error.statusCode = 400;
            throw error;
        }

        const hashedPassword = await hashPassword(password);

        // Set initial status directly to active if the bypass is triggered
        const initialStatus = bypassVerification ? "active" : "pending";
        const createdRows = await createNewUser(name, username, email, hashedPassword, initialStatus);

        const newUser = createdRows[0];
        if (!newUser) {
            const error = new Error("User couldn't register, try again");
            error.statusCode = 500;
            throw error;
        }

        // If bypassing, intercept here to dodge token generation & the Mailtrap transport call
        if (bypassVerification) {
            // FIXED: Removed email PII from logs for better privacy/security
            console.log(`[TEST BYPASS]: Skipping Mailtrap dispatch. Account created as "active".`);
            return {
                message: "Registration successful. Account auto-verified via test channel.",
                user: prepareUserResponse(newUser),
            };
        }

        // --- Standard Real Flow (Consumes Mailtrap Credits) ---
        const payload = { userId: newUser.id, email: newUser.email };
        const token = await generateToken(payload, "cat-app-email");
        const verificationUrl = `${ENV.BASE_URL}/api/v1/auth/verify-email?token=${token}`;

        // SERVERLESS NOTE: this MUST be awaited. On Vercel the function instance
        // can freeze as soon as the response is sent, killing fire-and-forget
        // promises mid-flight — the email would silently never send.
        // Errors are still caught so registration succeeds even if SMTP fails.
        try {
            const info = await sendEmail({
                to: newUser.email,
                subject: "Welcome! Please verify your email",
                message: `Hi ${newUser.name}, verify your account here: ${verificationUrl}`,
                html: buildVerificationEmailHtml(newUser.name, verificationUrl)
            });
            logger.info("Verification email dispatched", { userId: newUser.id, messageId: info?.messageId });
        } catch (emailError) {
            logger.error("Verification email dispatch failed", { error: emailError?.message, userId: newUser.id });
        }

        return {
            message: "Registration successful. Please verify your email.",
            user: prepareUserResponse(newUser),
        };
    } catch (err) {
        throw err;
    }
}

export const login = async (identifier, password, bypassVerification = false) => {
    try {
        const isEmail = emailSchema.safeParse(identifier).success;
        let user;

        if (isEmail) {
            user = await findUserByEmail(identifier);
        } else {
            user = await findUserByUsername(identifier);
        }

        if (!user) {
            const error = new Error("Invalid email/username or password credentials.");
            error.statusCode = 401;
            throw error;
        }

        if (user.status === "pending" && !bypassVerification) {
            const error = new Error("Please verify your email address before logging in.");
            error.statusCode = 403;
            throw error;
        }

        const isMatch = await verifyPassword(password, user.hashedPassword);
        if (!isMatch) {
            const error = new Error("Invalid email/username or password credentials.");
            error.statusCode = 401;
            throw error;
        }

        const payload = { userId: user.id, email: user.email, username: user.username };
        const token = await generateToken(payload);

        return {
            token,
            user: prepareUserResponse(user)
        }
    } catch (err) {
        throw err;
    }
}