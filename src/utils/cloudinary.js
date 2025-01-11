import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

async function uploadOnCloudinary(filePath) {
  try {
    if (!filePath) return null;
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    if (!response) throw new Error("Unable to Upload File in Cloudinary");
    fs.unlink(filePath);
    return response;
  } catch (error) {
    fs.unlink(filePath);
    console.log(error.message);
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
    if (!response) throw new Error("Unable to Delete Image from Clodinary");
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
    console.log(error.message);
    return null;
  }
}

export {
  uploadOnCloudinary,
  deleteImageFromCloudinary,
  deleteVideoFromCloudinary,
};
