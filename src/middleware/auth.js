import { ENV } from "../../env.js";
import jwt from "jsonwebtoken";

/**
 * Middleware to verify the user's JWT token.
 * It checks for the token in cookies or the Authorization header.
 */
export const authenticateToken = (req, res, next) => {
    try {
        // 1. Try to find the token
        // Check cookies first (convenient for browsers), then fallback to Bearer header (for API clients)
        let token = req.cookies?.token;

        if (!token) {
            const authHeader = req.headers["authorization"];
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        // 2. If no token is found, return 401 Unauthorized
        if (!token) {
            const error = new Error("Authentication required: No token provided");
            error.statusCode = 401;
            return next(error);
        }

        // 3. Verify the token
        jwt.verify(token, ENV.JWT_SECRET, (err, decodedPayload) => {
            if (err) {
                const message = err.name === "TokenExpiredError"
                    ? "Session expired, please login again"
                    : "Invalid or tampered authentication token";

                const error = new Error(message);
                error.statusCode = 403; // Forbidden if token is invalid/expired
                return next(error);
            }

            // 4. Attach user data to the request object
            // This allows subsequent controllers to know who is logged in
            req.user = {
                id: decodedPayload.userId,
                username: decodedPayload.username,
                email: decodedPayload.email
            };

            next();
        });
    } catch (error) {
        // Handle any unexpected runtime errors
        next(error);
    }
};