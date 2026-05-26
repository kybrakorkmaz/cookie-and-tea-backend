import express from "express";
import {ENV} from "../../env.js";
import {checkDatabaseConnection} from "../db/checkConnection.js";
import profileRouter from "../routes/profile/profile.routes.js";
import userRouter from "../routes/user/user.routes.js";
import {errorHandler} from "../handlers/errorHandler.js";

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/users", userRouter);

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

