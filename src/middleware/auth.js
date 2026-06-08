import {ENV} from "../../env.js";
import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    try{
        // authorization header
        const authHeader = req.Headers["authorization"];
        // extract the token from "Bearer <token>"
        const token = authHeader && authHeader.split(" ")[1];

        if(!token){
            const error = new Error("Access token missing or malformed");
            error.statusCode=401;
            return next(error);
        }

        // verify the token signature and expiration
        const jwtSecret = ENV.JWT_SECRET;

        jwt.verify(token, jwtSecret, (err, decodedPayload) => {
            if(err){
                // If token is expired or altered
                const error = new Error(
                    err.name === "TokenExpiredError"
                    ? "Session expired, please login again"
                        : "Invalid authentication token"
                );
                error.statusCode = 403;
                return next(error);
            }

            // attach the verified payload to the request object
            req.user = {
                id: decodedPayload.userId,
                username: decodedPayload.username,
                email: decodedPayload.email
            }

            // Authentication completed successfully, proceed to the next middleware or controller
            next();
        })
    }catch (error){
        // Fallback for any structural execution errors
        next(error);
    }
}