import Video from "../models/video.models.js";
import videoSchema from "../schemas/video.schemas.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

import Course from "../models/course.models.js";
export const updateVideoDetails = asyncHandler(async (req, res) => {
  try {
    const { role } = req.info;

    if (role !== "admin") {
      throw new ApiError({
        message: "Admin Only Access",
        statusCode: 401,
      });
    }
    const { videoId } = req.params;
    if (!videoId)
      throw new ApiError({
        message: "Video ._id is Required",
        statusCode: 400,
      });
    const newVideoDetails = req.body;
    if (!newVideoDetails)
      throw new ApiError({
        message: "Updated Video Details is Required",
        statusCode: 400,
      });
    const validatedInputs = videoSchema.safeParse(newVideoDetails);
    if (!validatedInputs.success) {
      throw new ApiError({
        message: validatedInputs.error?.issues?.[0]?.message,
        path: validatedInputs.error?.issues?.[0]?.path?.[0],
        statusCode: 400,
      });
    }
    let updatedVideo;
    try {
      updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        newVideoDetails
      ).select("-comments -notes");
    } catch (error) {
      throw new ApiError({
        message: "Unable to Update the video Details in DB",
        statusCode: 500,
      });
    }
    return res.status(200).json(
      new ApiResponse({
        statusCode: 200,
        message: "Video Successfully Updated",
        data: {
          s3Key: updatedVideo.s3Key,
          freePreview: updatedVideo.freePreview,
          title: updatedVideo.title,
          thumbnail: updatedVideo.thumbnail,
        },
      })
    );
  } catch (error) {
    return res
      .json(
        new ApiResponse({
          message: error.message,
          statusCode: error.statusCode || error.http_code || 500,
          path: error.path,
        })
      )
      .status(error.statusCode || error.http_code || 500);
  }
});

export const deleteVideoDetails = asyncHandler(async (req, res) => {
  try {
    const { role } = req.info;

    if (role !== "admin") {
      throw new ApiError({
        message: "Admin Only Access",
        statusCode: 401,
      });
    }
    const { videoId, courseId } = req.params;

    if (!videoId || !courseId) {
      throw new ApiError({
        message: "videoId and courseId are required",
        statusCode: 400,
      });
    }
    let video;
    try {
      video = await Video.findByIdAndDelete(videoId);
    } catch (error) {
      throw new ApiError({
        message: "Unable to delete Video",
        statusCode: 500,
      });
    }

    await Course.findByIdAndUpdate(courseId, {
      $pull: { videos_id: video._id },
    });

    return res
      .json(
        new ApiResponse({
          message: "Successfully deleted the video",
          statusCode: 204,
        })
      )
      .status(204);
  } catch (error) {
    return res
      .json(
        new ApiResponse({
          message: error.message,
          statusCode: error.statusCode || error.http_code || 500,
        })
      )
      .status(error.statusCode || error.http_code || 500);
  }
});

export const uploadS3VideoDetails = asyncHandler(async (req, res) => {
  try {
    const { role } = req.info;
    if (role !== "admin") {
      throw new ApiError({
        message: "Admin Only Access",
        statusCode: 401,
      });
    }
    const { courseId } = req.params;
    if (!courseId) {
      throw new ApiError({ message: "CourseId is Required", statusCode: 400 });
    }
    const { title, freePreview = false, s3Key } = req.body;
    const validatedInputs = videoSchema.safeParse({
      title,
      freePreview,
      s3Key,
    });
    if (!validatedInputs.success)
      throw new ApiError({
        message: validatedInputs.error?.issues?.[0]?.message,
        path: validatedInputs.error?.issues?.[0]?.path?.[0],
        statusCode: 400,
      });
    const video = await Video.create({
      title,
      freePreview,
      s3Key,
    });

    if (!video) {
      throw new ApiError({
        message: "Unable to Save Video Details in DB",
        statusCode: 500,
      });
    }
    await Course.findByIdAndUpdate(courseId, {
      $push: { videos_id: video._id },
    });

    return res.status(200).json(
      new ApiResponse({
        message: "S3 Video Details Successfully Saved",
        statusCode: 200,
        data: {
          _id: video._id,
          s3Key: video.s3Key,
        },
      })
    );
  } catch (error) {
    return res
      .json(
        new ApiResponse({
          message: error.message,
          statusCode: error.statusCode || error.http_code || 500,
          path: error?.path,
        })
      )
      .status(error.statusCode || error.http_code || 500);
  }
});
