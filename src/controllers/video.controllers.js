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
    const { path } = req.file;
    if (!path)
      throw new ApiError({
        message: "Unable to Upload Video By Multer",
        statusCode: 500,
      });

    const { public_id, url } = await uploadVideoOnCloudinary(path);
    if (!public_id && !url)
      throw new ApiError({
        message: "Unable To Upload the Video in Cloudinary",
        statusCode: 500,
      });
    return res.status(200).json(
      new ApiResponse({
        message: "Video Successfully Uploaded",
        statusCode: 200,
        data: {
          videoUrl: url,
          public_id: public_id,
        },
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

// export const uploadVideoThumbnail = asyncHandler(async (req, res) => {
//   try {
//     const { _id } = req.info;
//     if (!_id)
//       throw new ApiError({ statusCode: 403, message: "user info missing" });
//     const { videoId, courseId } = req.params;
//     if (!videoId)
//       throw new ApiError({ message: "videoId is Required", statusCode: 400 });
//     const video = Video.findById(videoId);
//     if (!video)
//       throw new ApiError({
//         message: "Unable to Fetch video form DB",
//         statusCode: 500,
//       });
//     const { path } = req.file;
//     if (!path)
//       throw new ApiError({
//         message: "Video Thumbnail is Required",
//         statusCode: 400,
//       });
//     if (video.thumbnail_id) {
//       const response = await deleteImageFromCloudinary(video.thumbnail_id);
//       if (!response) {
//         fs.unlinkSync(path);
//         throw new ApiError({
//           message: "Unable to Delete The Previous Video Thumbnail",
//           statusCode: 500,
//         });
//       }
//     }
//     const generated_public_id = courseId + "/" + Date.now();
//     const { public_id, url } = await uploadImageOnCloudinary(
//       path,
//       `Courses/${courseId}/thumbnail`,
//       generated_public_id
//     );
//     if (!public_id && !url)
//       throw new ApiError({
//         message: "Unable To Upload the Video Thumbnail in Cloudinary",
//         statusCode: 500,
//       });
//     video.thumbnail_id = public_id;
//     video.thumbnail = url;
//     video.save({ validateBeforeSave: false });
//     return res.status(200).json(
//       new ApiResponse({
//         statusCode: 200,
//         message: "Video Thumbanil updated successfully",
//       })
//     );
//   } catch (error) {
//     return res.status(error.statusCode || error.http_code || 500).json(
//       new ApiResponse({
//         message: error.message,
//         statusCode: error.statusCode || error.http_code || 500,
//       })
//     );
//   }
// });

export const deleteVideoDetails = asyncHandler(async (req, res) => {
  try {
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
      if (video.public_id) {
        deleteVideoFromCloudinary(video.public_id).then((r) => console.log(r));
      }
    } catch (error) {
      throw new ApiError({
        message: "Unable to Fetch video form DB",
        statusCode: 500,
      });
    }
    console.log(video);

    await Course.findByIdAndUpdate(courseId, {
      $pull: { videos_id: video._id },
    });
    return res.status(204).send();
  } catch (error) {
    return res.status(error.statusCode || error.http_code || 500).json(
      new ApiResponse({
        message: error.message,
        statusCode: error.statusCode || error.http_code || 500,
      })
    );
  }
});

export const uploadVideoDetails = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, freePreview = false, videoUrl, public_id } = req.body;
    const validatedInputs = videoSchema.safeParse({
      title,
      freePreview,
      videoUrl,
      public_id,
    });

    if (!courseId)
      throw new ApiError({ message: "CourseId is Required", statusCode: 400 });
    if (!validatedInputs.success)
      throw new ApiError({
        message: validatedInputs.error?.issues?.[0]?.message,
        path: validatedInputs.error?.issues?.[0]?.path?.[0],
        statusCode: 400,
      });
    const video = await Video.create({
      freePreview,
      videoUrl,
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
        message: "Video Details Successfully Uploaded",
        statusCode: 200,
        data: {
          _id: video._id,
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

export const updateVideoDetails = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!videoId)
      throw new ApiError({
        message: "Video _id is Required",
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
        data: updatedVideo,
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

export const videoDelete = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { publicId } = req.body;
    console.log(publicId);
    if (!publicId) {
      throw new ApiError({
        message: "publicId is Reqired",
        statusCode: 400,
      });
    }
    const response = await deleteVideoFromCloudinary(publicId);
    console.log(response);
    if (!response) {
      throw new ApiError({
        message: "Unable to delete Video from Cloudinary",
        statusCode: 500,
      });
    }
    if (videoId) {
      let video;
      try {
        video = await Video.findByIdAndUpdate(videoId, {
          videoUrl: "",
          public_id: "",
        });
      } catch (error) {
        throw new ApiError({
          message: "Unable to update Video Details",
          statusCode: 500,
        });
      }
    }
    return res.status(200).json(
      new ApiResponse({
        message: "Successfully deleted the video",
        statusCode: 200,
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
