import {createAction, fetchActionsForUser, markActionRead, deleteExpiredReadActions, deleteAction} from "../repositories/actions.repository.js";

export const notifyAction = async (payload) =>{
    // payload: {actorId, targetUserId, type, postId, amount, message}
    return await createAction(payload);
}

export const getActionsForUser = async (userId, page = 1, limit = 20) =>{
    return await fetchActionsForUser(userId, page, limit);
}

export const markAsRead = async (actionId, userId) =>{
    const result = await markActionRead(actionId, userId);
    if(!result || result.length === 0){
        const error = new Error("Action not found");
        error.statusCode = 404;
        throw error;
    }
    return result[0];
}

export const purgeExpiredReads = async () =>{
    return await deleteExpiredReadActions();
}

export const removeAction = async (actionId, userId) =>{
    return await deleteAction(actionId, userId);
}