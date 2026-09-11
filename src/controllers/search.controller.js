import {searchUsers} from "../services/search.service.js";

export const searchUsersController = async (req, res, next) => {
    try {
        // q/limit are already validated & transformed by the validate middleware
        const {q, limit} = req.query;

        const results = await searchUsers(q, limit);

        return res.status(200).json({
            status: "success",
            results: results.length,
            users: results
        });
    } catch (e) {
        next(e);
    }
};
