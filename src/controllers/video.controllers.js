import Video from "../models/video.models.js";
import videoSchema from "../schemas/video.schemas.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteImageFromCloudinary,
  deleteVideoFromCloudinary,
  uploadImageOnCloudinary,
  uploadVideoOnCloudinary,
} from "../utils/cloudinary.js";

import Course from "../models/course.models.js";

export const uploadVideo = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.info;
    const { courseId } = req.params;
    if (!_id)
      throw new ApiError({ statusCode: 403, message: "user info missing" });
    const { title, freePreview = false } = req.body;
    const validatedInputs = videoSchema.safeParse({
      title,
      freePreview,
    });

    if (!courseId)
      throw new ApiError({ message: "CourseId is Required", statusCode: 400 });
    if (!validatedInputs.success)
      throw new ApiError({
        message: validatedInputs.error?.issues?.[0]?.message,
        path: validatedInputs.error?.issues?.[0]?.path?.[0],
        statusCode: 400,
      });
    const { path } = req.file;

    if (!path)
      throw new ApiError({
        message: "Unable to Upload Video By Multer",
        statusCode: 500,
      });
    const generated_public_id = courseId + "/" + Date.now();
    const { public_id, url } = await uploadVideoOnCloudinary(
      path,
      `Courses/${courseId}/video`,
      generated_public_id
    );
    if (!public_id && !url)
      throw new ApiError({
        message: "Unable To Upload the Video in Cloudinary",
        statusCode: 500,
      });
    const video = await Video.create({
      freePreview,
      videoUrl: url,
      public_id,
      title,
    });
    if (!video)
      throw new ApiError({
        message: "Unable to Upload Video in DB",
        statusCode: 500,
      });
    await Course.findByIdAndUpdate(courseId, {
      $push: { videos_id: video._id },
    });
    return res.status(200).json(
      new ApiResponse({
        message: "Video Successfully Uploaded",
        statusCode: 200,
        data: {
          freePreview: video.freePreview,
          videoUrl: video.videoUrl,
          _id: video._id,
          title: video.title,
        },
      })
    );
  } catch (error) {
    return res.status(error.statusCode || error.http_code || 500).json(
      new ApiResponse({
        message: error.message,
        statusCode: error.statusCode || error.http_code || 500,
        path: error.path,
      })
    );
  }
});

export const uploadVideoThumbnail = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.info;
    if (!_id)
      throw new ApiError({ statusCode: 403, message: "user info missing" });
    const { videoId, courseId } = req.params;
    if (!videoId)
      throw new ApiError({ message: "videoId is Required", statusCode: 400 });
    const video = Video.findById(videoId);
    if (!video)
      throw new ApiError({
        message: "Unable to Fetch video form DB",
        statusCode: 500,
      });
    const { path } = req.file;
    if (!path)
      throw new ApiError({
        message: "Video Thumbnail is Required",
        statusCode: 400,
      });
    if (video.thumbnail_id) {
      const response = await deleteImageFromCloudinary(video.thumbnail_id);
      if (!response) {
        fs.unlinkSync(path);
        throw new ApiError({
          message: "Unable to Delete The Previous Video Thumbnail",
          statusCode: 500,
        });
      }
    }
    const generated_public_id = courseId + "/" + Date.now();
    const { public_id, url } = await uploadImageOnCloudinary(
      path,
      `Courses/${courseId}/thumbnail`,
      generated_public_id
    );
    if (!public_id && !url)
      throw new ApiError({
        message: "Unable To Upload the Video Thumbnail in Cloudinary",
        statusCode: 500,
      });
    video.thumbnail_id = public_id;
    video.thumbnail = url;
    video.save({ validateBeforeSave: false });
    return res.status(200).json(
      new ApiResponse({
        statusCode: 200,
        message: "Video Thumbanil updated successfully",
      })
    );
  } catch (error) {
    return res.status(error.statusCode || error.http_code || 500).json(
      new ApiResponse({
        message: error.message,
        statusCode: error.statusCode || error.http_code || 500,
      })
    );
  }
});

export const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.info;
    if (!_id)
      throw new ApiError({ statusCode: 403, message: "user info missing" });
    const { videoId, courseId } = req.params;
    if (!videoId)
      throw new ApiError({ message: "videoId is Required", statusCode: 400 });
    if (!courseId)
      throw new ApiError({ message: "CourseId is Required", statusCode: 400 });
    const video = Video.findById(videoId);
    if (!video)
      throw new ApiError({
        message: "Unable to Fetch video form DB",
        statusCode: 500,
      });
    if (video.public_id) {
      const response = await deleteVideoFromCloudinary(video.public_id);
      if (!response) {
        fs.unlinkSync(path);
        throw new ApiError({
          message: "Unable to Delete The Video",
          statusCode: 500,
        });
      }
    }
    await Course.findByIdAndUpdate(courseId, {
      $pull: { videos_id: video._id },
    });
    return res.status(200).json(
      new ApiResponse({
        statusCode: 200,
        message: "Video successfully",
      })
    );
  } catch (error) {
    return res.status(error.statusCode || error.http_code || 500).json(
      new ApiResponse({
        message: error.message,
        statusCode: error.statusCode || error.http_code || 500,
      })
    );
  }
});
