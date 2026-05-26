import express from "express";
import {getUserIntro, getUserPanel} from "../../controllers/profile.controller.js";

const router = express.Router();

// Base routes mapping directly to controllers
router.get("/", getUserPanel);
router.get("/intro", getUserIntro);

// Dummy faLLback sub-routes placeholders for upcoming features
router.get("/gallery", (req,res)=>res.json({message: "Gallery feature has not been implemented yet"}));
router.get("/posts", (req,res)=>res.json({message: "Posts feature has not been implemented yet"}));

export default router;