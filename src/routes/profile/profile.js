import express from "express";
import {db} from "../../db/client.js";
import {users} from "../../db/schema/auth.js";
import {eq} from "drizzle-orm";

const router = express.Router();
// get user profile info (name, username, user image, bg image etc.
router.get("/profile", async (req,res, next)=>{
    try{
        // Validate username as a non-empty string before DB query.
        const {username} = typeof req.query.username === "string" ? req.query.username.trim() : ""; // authenticated user's username

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

        if (!user || user.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = user[0];

        return res.json({
            id: userData.id,
            name: userData.name,
            username: userData.username,
            profileImage: userData.profileImage,
            backgroundImage: userData.backgroundImage,
            about: userData.about,
            followerCount: userData.followerCount,
            followingCount: userData.followingCount
        });
    }catch (e) {
       next(e);
    }
})

export default router;