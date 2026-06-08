import {registerNewUser, verifyUserToken} from "../services/auth.service.js";

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
