import {findUserByUsername, findUserById} from "../repositories/auth.repository.js";

const resolve = async (req, next, finder, identifier, errorType) => {
    try {
        const user = await finder(identifier);
        
        if (!user) {
            const error = new Error(`${errorType} '${identifier}' was not found`);
            error.statusCode = 404;
            throw error;
        }

        req.resolvedUser = user;
        next();
    } catch (e) {
        next(e);
    }
};

export const resolveUserById = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        const error = new Error("User not authenticated for resolution");
        error.statusCode = 401;
        return next(error);
    }
    await resolve(req, next, findUserById, req.user.id, "User profile with ID");
};

export const resolveGlobalUsername = async (req, res, next, username) => {
    const trimmedUsername = username.trim();
    if (trimmedUsername === "") {
        const error = new Error("Username cannot be empty");
        error.statusCode = 400;
        return next(error);
    }
    await resolve(req, next, findUserByUsername, trimmedUsername, "User profile for");
};