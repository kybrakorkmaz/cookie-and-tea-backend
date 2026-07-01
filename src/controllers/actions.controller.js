import { getActionsForUser, markAsRead, purgeExpiredReads } from "../services/actions.service.js";

export const getActionsController = async (req, res, next) =>{
    try{
        const user = req.resolvedUser;
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

        const actions = await getActionsForUser(user.id, page, limit);
        if(!actions || actions.length === 0) return res.status(404).json({ status: "fail", message: "No actions found" });
        return res.status(200).json({ status: "success", data: actions });
    }catch (e){
        next(e);
    }
}

export const markActionReadController = async (req, res, next) =>{
    try{
        const user = req.resolvedUser;
        const actionId = parseInt(req.params.id, 10);

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