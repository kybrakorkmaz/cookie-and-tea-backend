import { ENV } from "../../env.js";
import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    try {
        // Correct access using Express lowercase req.headers dictionary
        const authHeader = req.headers["authorization"];

        // Enforce strict Bearer scheme prefix verification with an early exit
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            const error = new Error("Access token missing or malformed");
            error.statusCode = 401;
            return next(error);
        }

        // Safely extract the token string component after the space index
        const token = authHeader.split(" ")[1];

        // Verify the token signature and expiration boundary controls
        const jwtSecret = ENV.JWT_SECRET;

        jwt.verify(token, jwtSecret, (err, decodedPayload) => {
            if (err) {
                // If token is expired or altered maliciously
                const error = new Error(
                    err.name === "TokenExpiredError"
                        ? "Session expired, please login again"
                        : "Invalid authentication token"
                );
                error.statusCode = 403;
                return next(error);
            }

            // Attach the verified operational payload properties to the request execution context
            req.user = {
                id: decodedPayload.userId,
                username: decodedPayload.username,
                email: decodedPayload.email
            };

            // Authentication completed successfully, proceed down the chain
            next();
        });
    } catch (error) {
        // Fallback catch block for any unexpected runtime execution breaks
        next(error);
    }
};