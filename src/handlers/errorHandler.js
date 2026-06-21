// Centralized error handler & logger trigger
import {logger} from "../lib/logger.js";
import {ENV} from "../../env.js";

export const errorHandler = (err, req, res, next) => {
    // 1. Identify status code and message defaults
    const incomingStatus = parseInt(err.statusCode, 10);
    const statusCode = (Number.isInteger(incomingStatus) && incomingStatus >= 100 && incomingStatus <= 599)
        ? incomingStatus
        : 500;

    const message = err.message || "Internal Server Error";

    // 2. Log the error using our logger
    // We pass the whole error object plus some request details
    logger.error(err, {
        statusCode,
        url: req.originalUrl,
        method: req.method,
    });

    // 3. Send the error response to the client
    res.status(statusCode).json({
        status: statusCode >= 500 ? "error" : "fail",
        message: (ENV.NODE_ENV === "production" && statusCode === 500)
            ? "An unexpected error occurred"
            : message,
        // Only include the stack trace and extra details in development
        ...(ENV.NODE_ENV === "development" && { stack: err.stack }),
        ...(err.details && { errors: err.details })
    });
};