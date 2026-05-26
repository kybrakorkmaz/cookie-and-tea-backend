import express from "express";
import { getUserIntro, getUserPanel } from "../../controllers/profile.controller.js";

const router = express.Router();

// Base routes mapping directly to controllers
router.get("/", getUserPanel);
router.get("/intro", getUserIntro);

//  Updated fallback sub-routes to return explicit HTTP 501 Not Implemented responses
router.get("/gallery", (req, res) =>
    res.status(501).json({ error: "Not Implemented", message: "Gallery feature has not been implemented yet" })
);
router.get("/posts", (req, res) =>
    res.status(501).json({ error: "Not Implemented", message: "Posts feature has not been implemented yet" })
);

export default router;