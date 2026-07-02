import express from "express";
import { validate } from "../middleware/validate.js";
import { commentSchema } from "../validations/comment.validation.js";
import {
    allCommentsController,
    createCommentController,
    deleteCommentController,
    updateCommentController
} from "../controllers/comment.controller.js";

const router = express.Router({ mergeParams: true });

// GET: /api/.../posts/:postId/comment
router.get("/", validate(commentSchema.postId), allCommentsController);

// POST: /api/.../posts/:postId/comment
router.post("/",
    validate(commentSchema.postId),
    validate(commentSchema.body),
    createCommentController
);

// PUT: /api/.../posts/:postId/comment/:commentId
router.put("/:commentId",
    validate(commentSchema.commentId),
    validate(commentSchema.body),
    updateCommentController
);

// DELETE: /api/.../posts/:postId/comment/:commentId
router.delete("/:commentId",
    validate(commentSchema.commentId),
    deleteCommentController
);

export default router;