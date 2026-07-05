import { getGalleryForUser } from "../services/gallery.service.js";

export const getGalleryController = async (req, res, next) =>{
    try{
        const user = req.resolvedUser;
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

        const gallery = await getGalleryForUser(user.id, page, limit);
        return res.status(200).json({ status: "success", data: gallery });
    }catch (e){
        next(e);
    }
};
