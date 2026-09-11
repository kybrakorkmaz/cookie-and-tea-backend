import express from "express";
import {searchUsersController} from "../controllers/search.controller.js";
import {validate} from "../middleware/validate.js";
import {searchUsersQuerySchema} from "../validations/search.validation.js";

const router = express.Router();

// Public endpoint — the guest navbar also renders the search bar.
// Only exposes safe public fields (id, name, username, profileImage).
router.get("/users", validate(searchUsersQuerySchema), searchUsersController);

export default router;
