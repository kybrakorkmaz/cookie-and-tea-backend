import express from "express";
import {createCommentController, previewCommentsController} from "../controllers/comment.controller.js";
import {validate} from "../middleware/validate.js";
import {commentSchema} from "../validations/comment.validation.js";
import {authenticateToken} from "../middleware/auth.js";

const router = express.Router({mergeParams: true});

router.use(authenticateToken);

// POST: /api/profile/:username/posts/:id/comments/
// POST: /api/feed/:username/posts/:id/comments/
router.post("/", validate(commentSchema), createCommentController);

// GET: /api/profile/:username/posts/:id/comments/?page=1&limit=10
// GET: /api/feed/:username/posts/:id/comments/?page=1&limit=10
router.get("/", previewCommentsController);

// 3. Paginated Load More: GET /.../:id/comment/?page=1&limit=10
//router.get("/", getCommentsController);

export default router;