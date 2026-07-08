import {changeUserSettings, getUserInfo} from "../services/settings.service.js";
export const getUserSettings = async (req,res, next) =>{
    try{
        const user = req.resolvedUser;
        const response = await getUserInfo(user.id);
        return res.status(200).json({
            status: "success",
            data: response
        })
    }catch (e){
        next(e);
    }
}
export const userSettingsController = async (req, res, next) =>{
    try{
        const user = req.resolvedUser;
        const payload = req.body;
        const response = await changeUserSettings(user.id, payload);
        return res.status(200).json({
            status: "success",
            data: response
        })
    }catch (e){
        next(e);
    }
}