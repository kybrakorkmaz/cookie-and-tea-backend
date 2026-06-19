import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {resolveGlobalUsername, resolveUserById} from "../middleware/resolveUser.js";
import { validate } from "../middleware/validate.js";
import { postSchema } from "../validations/post.validation.js";
import {addNewPostController, deletePostController, getFeedTimelineController, getPostController, updatePostController} from "../controllers/feed.controller.js";
const router = express.Router();

// Parameter Resolver
router.param("username", resolveGlobalUsername);

// Public routes
router.get("/:id", getPostController);

// Protected routes: Must be logged in to create, alter, or remove content
router.use(authenticateToken);
router.use(resolveUserById); // Injects req.resolvedUser (the viewer)

// Timeline of posts from people the viewer follows
router.get("/:username", getFeedTimelineController);
router.post("/:username", validate(postSchema), addNewPostController);
router.put("/:username/:id", validate(postSchema), updatePostController);
router.delete("/:username/:id", deletePostController);

export default router;