import express from "express";
import {createCommentController} from "../controllers/comment.controller.js";
import {validate} from "../middleware/validate.js";
import {commentSchema} from "../validations/comment.validation.js";
import {authenticateToken} from "../middleware/auth.js";

const router = express.Router({mergeParams: true});

router.use(authenticateToken);
router.post("/", validate(commentSchema), createCommentController);

export default router;