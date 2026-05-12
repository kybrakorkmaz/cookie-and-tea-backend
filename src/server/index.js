import express from "express";
import {ENV} from "../../env.js";
import {checkDatabaseConnection} from "../db/checkConnection.js";

const app = express();

// Middleware
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Cookie and TTea API",
        environment: ENV.NODE_ENV,
    });
});

app.get("/health", async (req, res) =>{
    const result = await checkDatabaseConnection();

    if(!result.success){
        return res.status(500).json({
            status: "error",
            database: "disconnected",
            message: result.message,
        });
    }

    return res.status(200).json({
        status: "ok",
        database: "connected",
    })
})

app.listen(ENV.PORT, ()=>{
    console.log(`Server running at ${ENV.BASE_URL}:${ENV.PORT}`);
});
