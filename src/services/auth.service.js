import { createNewUser, findUserByEmail, findUserByUsername, updateUserStatus } from "../repositories/auth.repository.js";
import jwt from "jsonwebtoken";
import { ENV } from "../../env.js";
import { sendEmail } from "../utils/email.util.js";
import { emailSchema } from "../validations/auth.validation.js";
import {hashPassword, verifyPassword} from "../utils/password.util.js";

const generateToken = async (payload) => {
    const jwtSecret = ENV.JWT_SECRET;
    const claims = {
        expiresIn: "1d",
        issuer: "cat-app",
        audience: "cat-app-users"
    };
    return jwt.sign(payload, jwtSecret, claims);
}

export const verifyUserToken = async (token) => {
    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET, {
            issuer: "cat-app",
            audience: "cat-app-users"
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
        const token = await generateToken(payload);
        const verificationUrl = `${ENV.BASE_URL}/api/v1/auth/verify-email?token=${token}`;

        // Fire-and-forget email; swallow errors to avoid async logging outside request lifecycle
        sendEmail({
            to: newUser.email,
            subject: "Welcome! Please verify your email",
            message: `Hi ${newUser.name}, verify your account here: ${verificationUrl}`,
            html: `<p>Hi ${newUser.name},</p><p>Please click <a href="${verificationUrl}">here</a> to verify your account.</p>`
        }).catch(() => {});

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