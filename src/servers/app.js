import express from "express";
import {ENV} from "../../env.js";
import {checkDatabaseConnection} from "../db/checkConnection.js";
import profileRouter from "../routes/profile/profile.route.js";
import authRouter from "../routes/auth/auth.route.js";
import feedRouter from "../routes/feed.route.js";
import {errorHandler} from "../handlers/errorHandler.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import {testInterceptorMiddleware} from "../middleware/testInterceptor.middleware.js";
const app = express();

// ALWAYS place CORS at the absolute top of your middleware stack!
const corsOptions = {
    // development -> test -> production
    origin: ENV.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    // Added X-Requested-With and credentials headers for standard preflight compliance
    // Added Authorization to allowed headers for when restoring JWT tokens later
    // Whitelist your custom bypass test header
    allowedHeaders: ['Content-Type', 'X-Requested-With', 'Authorization', 'x-test-bypass'],
}

// 1. CORS & Parsers
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));


// 2. Global Middleware
// REMOVED duplicate express.json() call
app.use(testInterceptorMiddleware);

// 3. Routes
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/feed", feedRouter);
app.use("/api/v1/posts", feedRouter);

// Legacy aliases
app.use("/api/profile", profileRouter);
app.use("/api/auth", authRouter);
app.use("/api/posts", feedRouter);

// Health & Root
app.get("/", (req, res) => {
    res.json({
        message: "Cookie and Tea API",
        environment: ENV.NODE_ENV,
    });
});

app.get("/health", async (req, res) => {
    const result = await checkDatabaseConnection();

    if(!result.success){
        console.error("Health check failed:", result.message);
        return res.status(500).json({
            status: "error",
            database: "disconnected",
            message: "Database connection error",
        });
    }

    return res.status(200).json({
        status: "ok",
        database: "connected",
    });
});

// 404 Fallback routing handler - Catches missed routes and passes an error forward
app.use((req, res, next)=>{
    const notFoundError = new Error(`Can't find path ${req.originalUrl} on this server`);
    notFoundError.statusCode = 404;
    next(notFoundError)
});

// The Error Middleware must ALWAYS sit dead last at the bottom
app.use(errorHandler);

export default app;

