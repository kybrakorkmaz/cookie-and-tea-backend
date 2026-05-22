import express from "express";

const router = express.Router();

// fetch all brief info about user
router.get("/intro", async (req,res)=>{
    return res.status(501).json({error: "Not implemented yet"});
})

export default router;