import {searchUsersByNameOrUsername} from "../repositories/search.repository.js";

export const searchUsers = async (query, limit) => {
    return searchUsersByNameOrUsername(query, limit);
};
