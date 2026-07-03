import { getActionsForUser, markAsRead, purgeExpiredReads } from "../services/actions.service.js";

export const getActionsController = async (req, res, next) =>{
    try{
        const user = req.resolvedUser;
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

        if (!Number.isInteger(page) || page <= 0 || !Number.isInteger(limit) || limit <= 0 || limit > 100) {
            return res.status(400).json({ status: "fail", message: "Invalid pagination parameters" });
        }

        const scope = req.query.scope === "sent" ? "sent" : "received";

        const actions = await getActionsForUser(user.id, page, limit, scope);
        return res.status(200).json({ status: "success", data: actions });
    }catch (e){
        next(e);
    }
}

export const markActionReadController = async (req, res, next) =>{
    try{
        const user = req.resolvedUser;
        const actionId = parseInt(req.params.id, 10);

        // Intercept NaN, floats, or negative numbers before hitting the repository layer
        if (!Number.isInteger(actionId) || actionId <= 0) {
            return res.status(400).json({ status: "fail", message: "Invalid action id" });
        }

        const result = await markAsRead(actionId, user.id);
        return res.status(200).json({ status: "success", data: result });
    }catch (e){
        next(e);
    }
}

// A background endpoint to manually trigger cleanup (not exposed publicly in production)
export const purgeExpiredReadsController = async (req, res, next) =>{
    try{
        const result = await purgeExpiredReads();
        return res.status(200).json({ status: "success", deleted: result.length });
    }catch (e){
        next(e);
    }
}