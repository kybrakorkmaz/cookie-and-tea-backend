import {
    createAction,
    fetchActionsForUser,
    fetchActionsSentByUser,
    markActionRead,
    deleteExpiredReadActions,
    deleteAction,
} from "../repositories/actions.repository.js";

const truncate = (text, maxLength = 40) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

const formatActionForClient = (action) => {
    let actionText = "";

    switch (action.type) {
        case "comment":
            actionText = action.message
                ? `commented: "${truncate(action.message)}"`
                : "commented on your post";
            break;
        case "donation":
            actionText = `donated $${(action.amount ?? 0) / 100}`;
            break;
        case "follow":
            actionText = "started following you";
            break;
        default:
            actionText = action.message || "";
    }

    return {
        id: action.id,
        type: action.type,
        action: actionText,
        actor: {
            id: action.actorId,
            name: action.actorName,
            username: action.actorUsername,
            profileImage: action.actorProfileImage,
        },
        postId: action.postId,
        amount: action.amount,
        amountDollars: action.amount != null ? action.amount / 100 : null,
        message: action.message,
        status: action.status,
        readAt: action.readAt,
        createdAt: action.createdAt,
    };
};

export const notifyAction = async (payload) => {
    if (payload.actorId === payload.targetUserId) {
        return null;
    }
    return createAction(payload);
};

export const notifyComment = async ({ actorId, targetUserId, postId, message }) =>
    notifyAction({ actorId, targetUserId, type: "comment", postId, message });

export const notifyDonation = async ({ actorId, targetUserId, amount }) =>
    notifyAction({ actorId, targetUserId, type: "donation", amount });

export const notifyFollow = async ({ actorId, targetUserId }) =>
    notifyAction({ actorId, targetUserId, type: "follow", message: "started following you" });

export const getActionsForUser = async (userId, page = 1, limit = 20, scope = "received") => {
    const rows = scope === "sent"
        ? await fetchActionsSentByUser(userId, page, limit)
        : await fetchActionsForUser(userId, page, limit);

    return rows.map(formatActionForClient);
};

export const markAsRead = async (actionId, userId) => {
    const result = await markActionRead(actionId, userId);
    if (!result || result.length === 0) {
        const error = new Error("Action not found");
        error.statusCode = 404;
        throw error;
    }
    return result[0];
};

export const purgeExpiredReads = async () => {
    return await deleteExpiredReadActions();
};

export const removeAction = async (actionId, userId) => {
    return await deleteAction(actionId, userId);
};
