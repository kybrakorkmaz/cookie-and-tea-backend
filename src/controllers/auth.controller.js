import {login, registerNewUser, verifyUserToken} from "../services/auth.service.js";
import {ENV} from "../../env.js";
import {logger} from "../lib/logger.js";
// @src/controllers/auth.controller.js

export const signUpController = async (req, res, next) => {
    // Added try/catch block to prevent unhandled rejections from crashing the process
    try {
        const {
            username,
            email,
            name,
            password,
        } = req.body;

        // BYPASS CHECK: Detect the test bypass signature
        const isTestEnv = ENV.NODE_ENV === "test";
        const hasBypassHeader = req.headers["x-test-bypass"] === ENV.BYPASS_SECRET;
        const shouldBypassVerification = isTestEnv && hasBypassHeader;

        // Pass the bypass instruction down to your registration service layer
        const response = await registerNewUser(name, username, email, password, shouldBypassVerification);

        // Return a helper mock flag in the response json so your frontend test suite knows an auto-verify took place
        return res.status(201).json({
            ...response,
            ...(shouldBypassVerification && { autoVerified: true })
        });
    } catch (e) {
        // Safely intercept the error and pass it to Express's central error handler
        console.error("CRASH DETECTED IN SIGNUP PIPELINE:", e);
        next(e);
    }
}

export const verifyEmailController = async (req, res) => {
    // This endpoint is only ever opened by a browser clicking the email link —
    // respond with a redirect to the frontend, never raw JSON.
    const loginUrl = `${ENV.FRONTEND_ORIGIN}/login`;
    try{
        const {token} = req.query; // Reads ?token=xxxxx from URL

        if(!token) {
            return res.redirect(`${loginUrl}?verified=0&reason=missing-token`);
        }

        await verifyUserToken(token);

        return res.redirect(`${loginUrl}?verified=1`);
    }catch (e){
        // Expired/invalid token or unexpected failure → land on login with a flag
        logger.error("Email verification failed", { error: e?.message });
        return res.redirect(`${loginUrl}?verified=0&reason=invalid-or-expired`);
    }
}

export const loginController = async (req, res, next) => {
    try {
        const {identifier, password} = req.body;

        // Safely extract a custom header only allowed in non-production environments
        const isTestEnv = ENV.NODE_ENV === "test";
        const hasBypassHeader = req.headers["x-test-bypass"] === ENV.BYPASS_SECRET;
        const shouldBypass = isTestEnv && hasBypassHeader;

        const {token, user} = await login(identifier, password, shouldBypass);

        const cookieOptions = {
            maxAge: 1*24*60*60*1000, // " Day in milliseconds
            httpOnly: true,          // Prevents Cross-Site Scripting (XSS) cookies access
            secure: ENV.NODE_ENV === "production", // HTTPS only in production
            // "none" is required in production because frontend and API are on
            // different domains (cross-site); browsers drop "strict" cookies there.
            sameSite: ENV.NODE_ENV === "production" ? "none" : "strict",
            path: "/"
        }

        // Attach token context to response cookie header channel
        res.cookie("token", token, cookieOptions);

        // Return user info to client state
        return res.status(200).json({
            status: "success",
            message: "Authentication verified successfully.",
            user
        });
    }catch (e){
        next(e);
    }
}

export const logoutController = async (req, res, next) => {
    try{
        // Clear the token cookie by setting its maxAge to 0 milliseconds
        res.cookie("token", "", {
            httpOnly: true,
            secure: ENV.NODE_ENV === "production",
            sameSite: ENV.NODE_ENV === "production" ? "none" : "strict", // must match login
            path: "/",
            maxAge: 0 // tells the browser/Postman to delete the cookie instantly
        });

        return res.status(200).json({
            status: "success",
            message: "Logged out successfully."
        });
    }catch (e){
        next(e);
    }
}

export const getMeController = async (req, res, next) =>{
    try{
        return res.status(200).json({
            status: "success",
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email
            }
        })
    }catch (e){
        next(e);
    }
}