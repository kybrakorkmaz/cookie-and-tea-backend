import rateLimit from "express-rate-limit";
import { ENV } from "../../env.js";

// The Jest suite hammers auth/donate endpoints across suites — never throttle tests
const skipInTests = () => ENV.NODE_ENV === "test";

const tooMany = { status: "fail", message: "Too many attempts, please try again later." };

// Credential-stuffing guard for login / sign-up
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTests,
    message: tooMany,
});

// Payment endpoints — card saves, sub-merchant onboarding, tips
export const donateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTests,
    message: tooMany,
});

// Unauthenticated client log sink — keep it useful but unspammable
export const logLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTests,
    message: tooMany,
});
