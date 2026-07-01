import express from "express";
import {
    allCommentsController,
    createCommentController, deleteCommentController,
    previewCommentsController,
    updateCommentController
} from "../controllers/comment.controller.js";
import {validate} from "../middleware/validate.js";
import {commentSchema} from "../validations/comment.validation.js";
import {authenticateToken} from "../middleware/auth.js";

const router = express.Router({mergeParams: true});

router.use(authenticateToken);

// POST: /api/profile/:username/posts/:id/comments/
// POST: /api/feed/:username/posts/:id/comments/
router.post("/", validate(commentSchema), createCommentController);

// UPDATE: /api/profile/:username/posts/:id/comments/:id
// UPDATE: /api/feed/:username/posts/:id/comments/:id
router.put("/:id", validate(commentSchema), updateCommentController);

// DELETE: /api/profile/:username/posts/:id/comments/:id
// DELETE: /api/feed/:username/posts/:id/comments/:id
router.delete("/:id", deleteCommentController);


export default router;