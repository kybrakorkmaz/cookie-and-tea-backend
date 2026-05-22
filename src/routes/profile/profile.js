import express from "express";
import {db} from "../../db/client.js";
import {users} from "../../db/schema/auth.js";
import {eq} from "drizzle-orm";

const router = express.Router();
// get user profile info (name, username, user image, bg image etc.
router.get("/profile", async (req,res)=>{
    try{
        const {username} = req.query; // authenticated user's username

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
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
})

export default router;