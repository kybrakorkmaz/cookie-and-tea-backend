import winston from "winston";
import {ENV} from "../../env.js";

let info, format, isProduction;
// winston log levels: silly -> debug -> verbose -> info -> warn -> error
const {combine, timestamp, json, colorize, simple, printf} = winston.format;
// Create and export a configured logger instance

// 1. Determine the environment
const isProd = ENV.NODE_ENV === "production";
const isTest = ENV.NODE_ENV === "test";

// 2. Define a clean pretty print format for Development terminal viewing
const devLogFormat = printf(({level, message, timestamp, ...metadata}) => {
    let extraMeta = Object.keys(metadata).length ? JSON.stringify(metadata) : "";
    return `${timestamp} [${level}]: ${message} ${extraMeta}`;
});

// 3. Set minimum severity level dynamically
// Dev logs everything down to debug. Prod hides debug/verbose. Test stays completely silent
let logLevel = "debug";
if(isProd) logLevel="info";
if(isTest) logLevel = "error"; // Keeps test runs completely clean unless it's a real failure

export const logger = winston.createLogger({
    level: logLevel, // Set minimum log level (info, debug, etc)
    // If we are in test mode, do not log anything to console, otherwise use dynamic formats
    silent: isTest,
    transports: [
        new winston.transports.Console({ // Log to console
            format: isProd
            ? combine(timestamp(), json())// Strict fast JSON structure for cloud aggregators (AWS, Datadog)
                : combine(
                    timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
                    colorize({all: true}),
                    devLogFormat // Human-friendly format for local dev debug
                )
        }),
    ],
});

// --- Production-only log to file
// Instead of evaluating inside the array, we cleanly push file tracking configuration on production builds
if (isProd) {
    // Capture general system information logs
    logger.add(
        new winston.transports.File({
            filename: "src/logs/combined.log",
            level: "info",
            format: combine(timestamp(), json()),
        })
    );

    // Separate critical application crashes or server catches
    logger.add(
        new winston.transports.File({
            filename: "src/logs/error.log",
            level: "error",
            format: combine(timestamp(), json()),
        })
    );
}