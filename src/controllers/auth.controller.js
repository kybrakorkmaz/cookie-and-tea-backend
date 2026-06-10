import {login, registerNewUser, verifyUserToken} from "../services/auth.service.js";
import {ENV} from "../../env.js";

export const signUpController = async (req,res, next) =>{
    try{
        const {
            username,
            email,
            name,
            password
        } = req.body;
        const response = await registerNewUser(name, username, email, password);
        return res.status(201).json(response);
    }catch (e){
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

        const {token, user} = await login(identifier, password);

        const cookieOptions = {
            maxAge: 1*24*60*60*1000, // " Day in milliseconds
            httpOnly: true,          // Prevents Cross-Site Scripting (XSS) cookies access
            secure: ENV.NODE_ENV === "production", // HTTPS only in production
            sameSite: "lax"          // Mitigates Cross-Site Request Forgery (CSRF)
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
