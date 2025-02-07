import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ApiError from "./ApiError.js";
// import ApiResponse from "./ApiResponse";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImageOnCloudinary(filePath) {
  try {
    if (!filePath) return null;

    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    if (!response)
      throw new ApiError({
        message: "Unable to Upload File in Cloudinary",
        statusCode: 500,
      });
    fs.unlinkSync(filePath);
    return response;
  } catch (error) {
    fs.unlinkSync(filePath);
    // return res.statusCode(error.statusCode || error.http_code || 500).json(
    //   new ApiResponse({
    //     statusCode: error.statusCode || error.http_code || 500,
    //     message: error.message,
    //   })
    // );
    return null;
  }
}

async function uploadVideoOnCloudinary(filePath, folderPath, public_id) {
  try {
    if (!filePath) return null;
    const response = await cloudinary.uploader.upload(filePath, {
      // public_id,
      // folder: folderPath,
      resource_type: "auto",
    });
    if (!response) throw new Error("Unable to Upload File in Cloudinary");
    fs.unlinkSync(filePath);
    return response;
  } catch (error) {
    fs.unlinkSync(filePath);
    return null;
  }
}

async function deleteImageFromCloudinary(publicid) {
  try {
    if (!publicid) return null;
    const response = await cloudinary.uploader.destroy(publicid, {
      resource_type: "image",
      invalidate: true,
    });
    if (!response)
      throw new ApiError({
        message: "Unable to Delete File in Cloudinary",
        statusCode: 500,
      });
    return response;
  } catch (error) {
    console.log(error.message);
    return null;
  }
}

async function deleteVideoFromCloudinary(publicid) {
  try {
    if (!publicid) return null;
    const response = await cloudinary.uploader.destroy(publicid, {
      resource_type: "video",
      invalidate: true,
    });
    if (!response) throw new Error("Unable to Delete Video from Clodinary");
    return response;
  } catch (error) {
    return null;
  }
}

export const transformImage = (public_id) => {
  try {
    const autoCropUrl = cloudinary.url(public_id, {
      crop: "auto",
      gravity: "auto",
      width: 500,
      height: 500,
    });
    if (!autoCropUrl)
      throw new ApiError({
        message: "Unable to Transform Image",
        statusCode: 500,
      });
    return autoCropUrl;
  } catch (error) {
    return null;
  }
};

export {
  uploadImageOnCloudinary,
  uploadVideoOnCloudinary,
  deleteImageFromCloudinary,
  deleteVideoFromCloudinary,
};
