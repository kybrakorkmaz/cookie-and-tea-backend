import express from "express";
import { validate } from "../middleware/validate.js";
import { postSchema } from "../validations/post.validation.js";
import { deletePostController, updatePostController } from "../controllers/post.controller.js";
import commentRoute from "./comment.route.js";
import {uploadMiddleware} from "../middleware/multer.middleware.js";

const router = express.Router({ mergeParams: true });

router.put(
    "/:postId",
    uploadMiddleware,
    validate(postSchema.params), // Validate URL ID
    validate(postSchema.update), // Validate Update Body
    updatePostController
);

router.delete("/:postId", validate(postSchema.params), deletePostController);

// Nested routes use the postId from the parent
router.use("/:postId/comment", commentRoute);
export default router;