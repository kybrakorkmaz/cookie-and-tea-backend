import {getIntroDashboard, getPanelInfo} from "../services/profile.service.js";

export const getUserPanel = async (req, res, next) =>{
    try{
        const username = typeof req.query.username === "string" ? req.query.username.trim() : "";
        if (!username) {
            const error = new Error("Username query parameter is mandatory");
            error.statusCode = 400;
            throw error;
        }

        const panelData = await getPanelInfo(username);
        return res.status(200).json(panelData);
    }catch (e){
        next(e);
    }
}

export const getUserIntro = async (req, res, next) =>{
    try{
        const username = typeof req.query.username === "string" ? req.query.username.trim() : "";
        if (!username) {
            const error = new Error("Username query parameter is mandatory");
            error.statusCode = 400;
            throw error;
        }

        const timelineInput = Number(req.query.earningTimeline);
        const daysLimit = Number.isInteger(timelineInput) && timelineInput > 0 ? timelineInput:30;

        // Default tp follower strategy unless explicit fallback flag is parsed
        const isFollowerView = req.query.isFollower !== "false";

        const introData = await getIntroDashboard(username, daysLimit, isFollowerView);
        return res.status(200).json(introData);
    }catch (e) {
        next(e);
    }
}