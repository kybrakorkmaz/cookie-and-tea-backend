import winston from "winston";
import { ENV } from "../../env.js";
import fs from "node:fs";
import path from "node:path";

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

// 1. Setup Environment Flags
const isProd = ENV.NODE_ENV === "production";
const isTest = ENV.NODE_ENV === "test";

// 2. Custom format for local development (clean and readable)
const localFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    // Show the error stack trace if it exists, otherwise show the message
    const logContent = stack || message;

    // Format extra data (metadata) as a pretty JSON string if it's not empty
    const hasMetadata = Object.keys(metadata).length > 0;
    const metaString = hasMetadata ? `\n${JSON.stringify(metadata, null, 2)}` : "";

    return `${timestamp} [${level}]: ${logContent}${metaString}`;
});

// 3. Determine the minimum log level based on environment
const getLogLevel = () => {
    if (isTest) return "error"; // Only show errors during tests
    if (isProd) return "info";  // Standard info logging for production
    return "debug";             // Detailed logging for development
};

// 4. Create the Logger instance
export const logger = winston.createLogger({
    level: getLogLevel(),
    silent: isTest, // Don't output anything to console during tests
    defaultMeta: { service: "cookie-and-tea-api" },
    format: combine(
        errors({ stack: true }), // Capture stack traces for Error objects
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" })
    ),
    transports: [
        // Always log to the console
        new winston.transports.Console({
            format: isProd
                ? combine(json()) // Production: JSON format for log parsers
                : combine(
                    colorize({ all: true }), // Dev: Add colors for readability
                    localFormat
                )
        }),
    ],
});

// 5. File Logging (Production Only)
// We save logs to files so we can investigate issues later if the server crashes
if (isProd) {
    const logDir = path.resolve("logs");

    // Ensure the logs directory exists
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Save all logs (info and above) to combined.log
    logger.add(new winston.transports.File({
        filename: path.join(logDir, "combined.log"),
        format: combine(json()),
        maxsize: 5242880, // 5MB limit per file
        maxFiles: 5,      // Keep up to 5 old log files
    }));

    // Save only error logs to error.log
    logger.add(new winston.transports.File({
        level: "error",
        filename: path.join(logDir, "error.log"),
        format: combine(json()),
        maxsize: 5242880,
        maxFiles: 5,
    }));
}