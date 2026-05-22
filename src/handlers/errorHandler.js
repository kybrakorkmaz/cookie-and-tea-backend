// Centralized error handler & logger trigger
import {logger} from "../lib/logger.js";
import {ENV} from "../../env.js";

export const errorHandler = (err, req, res, next) =>{
    // 1. Identify status code and message defaults
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // 2. Pass error metadata straight into the Winston logger.
    // Winston handles printing this as clean terminal text (Dev) or flat JSON (Prod) automatically.
    logger.error({
        message: err.message,
        statusCode,
        route: req.originalUrl,
        method: req.method,
        stack: err.stack, // Line numbers showing exactly where the bug live
    });

    // Return formatted JSON to the client app
    res.status(statusCode).json({
        status: statusCode >= 400 && statusCode < 500 ? "fail":"error",
        message: ENV.NODE_ENV === "production" && statusCode === 500
        ? "An unexpected error occurred" // Prevent leaking sensitive stack traces in prod
        : message,
        // Optional: Add a stack property helper only available on local dev systems
        ...(ENV.NODE_ENV === "development" && {stack: err.stack})
    });
}