import {fetchUserInfo, updateUserSettings} from "../repositories/settings.repository.js";
import {hashPassword} from "../utils/password.util.js";

export const getUserInfo = async (userId) =>{
    const result = await fetchUserInfo(userId);
    if(!result || result.length ===0){
        const error = new Error("User info couldn't be fetched, try later!");
        error.statusCode = 500;
        throw error;
    }
    return result[0];
}
export const changeUserSettings = async (userId, payload) => {
    const { confirmPassword, ...updateData } = payload;

    if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
    }

    const result = await updateUserSettings(userId, updateData);

    if (!result || result.length === 0) {
        const error = new Error("User info couldn't be updated, try later!");
        error.statusCode = 500;
        throw error;
    }
    return result[0];
};