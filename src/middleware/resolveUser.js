import {findUserByUsername, findUserById} from "../repositories/auth.repository.js";

export const resolveUserById = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            const error = new Error("User not authenticated for resolution");
            error.statusCode = 401;
            throw error;
        }

        const user = await findUserById(req.user.id);
        
        if (!user) {
            const error = new Error(`User profile with ID '${req.user.id}' was not found`);
            error.statusCode = 404;
            throw error;
        }

        req.resolvedUser = user;
        next();
    } catch (e) {
        next(e);
    }
};

export const resolveGlobalUsername = async (req, res, next, username) => {
    try {
        const trimmedUsername = username.trim();
        if (trimmedUsername === "") {
            const error = new Error("Username cannot be empty");
            error.statusCode = 400;
            throw error;
        }

        const user = await findUserByUsername(trimmedUsername);
        
        if (!user) {
            const error = new Error(`User profile for '${username}' was not found`);
            error.statusCode = 404;
            throw error;
        }

        req.resolvedUser = user;
        next();
    } catch (e) {
        next(e);
    }
};