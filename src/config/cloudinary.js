import{v2 as cloudinary} from "cloudinary";
import {ENV} from "../../env.js";
cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (fileBuffer, resourceType="image") =>{
    return new Promise((resolve, reject) =>{
      cloudinary.uploader.upload_stream(
          {resource_type: resourceType}, // Ensure this is 'image' or 'video'
          (error, result) =>{
              if(error) reject(error);
              else resolve(result.secure_url);
          }
      ).end(fileBuffer);
    });
}