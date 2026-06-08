import {createNewUser, updateUserStatus} from "../repositories/auth.repository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {ENV} from "../../env.js";
import {sendEmail} from "../utils/email.util.js";

const generateToken = async (payload) => {
    const jwtSecret = ENV.JWT_SECRET;
    const claims = {
        expiresIn: "1d", // Give users 24 hours to click an email verification link
        issuer: "cat-app",
        audience: "cat-app-users"
    };
    return jwt.sign(payload, jwtSecret, claims);
}
export const verifyUserToken = async (token) => {
    try{
        const decoded = jwt.verify(token, ENV.JWT_SECRET);

        // update user status in DB from pending to active
        const updatedUser = await updateUserStatus(decoded.userId, "active");
        if(!updatedUser){
            const error = new Error("User not found or activation failed");
            error.statusCode=404;
            throw error;
        }
        return updatedUser;
    }catch (err){
        if(err.name === "TokenExpiredError"){
            const error = new Error ("Verification link expired. Please sign up again.");
            error.statusCode = 400;
            throw error;
        }
        const error = new Error("Invalid verification link.");
        error.statusCode = 400;
        throw error;
    }
}
const hashPassword = async (password) => {
    const saltRounds = 10; // a value between 10 and 12
    try{
        return await bcrypt.hash(password, saltRounds);

    }catch (err){
        console.error("Cannot encrypt", err);
        throw err;
    }
}
export const registerNewUser = async (name, username, email, password) => {
    try{
       // Create user in DB (status: pending)
        const hashedPassword = await hashPassword(password);
        const createdRows = await createNewUser(name, username, email, hashedPassword);
        const newUser = createdRows[0];
        if(!newUser){
            const error = new Error("User couldn't register, try again");
            error.statusCode = 500;
            throw error;
        }
        // Generate token payload
        const payload = {
            userId: newUser.id,
            email: newUser.email
        }
        const token = await generateToken(payload);

        // Construct verification URL pointing to your backend endpoint
        const verificationUrl = `${ENV.BACKEND_URL}/api/auth/verify-email?token=${token}`;

        // send the email asynchronously
        sendEmail({
            subject: "Welcome! Please verify your email",
            message: `Hi ${newUser.name}, verify your account here: ${verificationUrl}`,
            html: `<p>Hi ${newUser.name},</p><p>Please click <a href="${verificationUrl}">here</a> to verify your account.</p>`
        }).catch(err => console.error("Email failed to dispatch background task:", err));

        //  Do not return the hashed password back to the client
        const { hashedPassword: _, ...userWithoutPassword } = newUser;
        return {
            message: "Registration successful. Please verify your email.",
            user: userWithoutPassword,
        };
    }catch (err){
        throw err;
    }
}