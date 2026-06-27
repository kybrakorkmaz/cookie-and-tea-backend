import {login, registerNewUser, verifyUserToken} from "../services/auth.service.js";
import {ENV} from "../../env.js";
// @src/controllers/auth.controller.js

export const signUpController = async (req, res, next) => {
    // 🚀 FIXED: Added try/catch block to prevent unhandled rejections from crashing the process
    try {
        const {
            username,
            email,
            name,
            password,
        } = req.body;

        // BYPASS CHECK: Detect the test bypass signature
        const isTestEnv = ENV.NODE_ENV === "test" || ENV.NODE_ENV === "development";
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
        // 🚀 FIXED: Safely intercept the error and pass it to Express's central error handler
        console.error("❌ CRASH DETECTED IN SIGNUP PIPELINE:", e);
        next(e);
    }
}

export const verifyEmailController = async (req, res, next) => {
    try{
        const {token} = req.query; // Reads ?token=xxxxx from URL

        if(!token) {
            const error = new Error("Verification token missing");
            error.statusCode = 400;
            return next(error);
        }

        await verifyUserToken(token);

        return res.status(200).json({status: "success", message: "Email successfully! You can now log in."});
    }catch (e){
        next(e);
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
            sameSite: "strict",          // Mitigates Cross-Site Request Forgery (CSRF)
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
            sameSite: "strict", // must match login
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