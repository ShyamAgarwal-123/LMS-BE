import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteS3Object,
  generateGetURL,
  generateUploadURL,
} from "../utils/s3.js";
const folderType = {
  videos: 1,
  thumbnails: 1,
  profiles: 1,
};
export const generatePUTPreSignedURL = asyncHandler(async (req, res) => {
  try {
    const { _id, role } = req.info;
    const { file, folder } = req.query;
    if (!file || !folder) {
      throw new ApiError({
        message: "FileType and FolderType both is Required",
        statusCode: 400,
      });
    }
    const fileType = file.split("/")[1];
    if (!fileType) {
      throw new ApiError({
        message: "fileType is Required",
        statusCode: 400,
      });
    }
    if (!folderType.hasOwnProperty(folder)) {
      throw new ApiError({
        message: "Invalid Folder Type",
        statusCode: 400,
      });
    }

    if (role !== "admin" && folder === "videos") {
      throw new ApiError({
        message: "Unathorised upload to videos folder",
        statusCode: 401,
      });
    }
    const { uploadURL, Key } = await generateUploadURL(fileType, folder, _id);
    return res.status(200).json(
      new ApiResponse({
        message: "Successfully generated pre signed url to upload",
        statusCode: 200,
        data: {
          uploadURL,
          Key,
        },
      })
    );
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

export const generateGETVideoPreSignedURL = asyncHandler(async (req, res) => {
  try {
    const { role } = req.info;
    if (role !== "admin") {
      throw new ApiError({
        message: "Unauthorised Request (only admin)",
        statusCode: 401,
      });
    }
    const { key } = req.query;
    if (!key) {
      throw new ApiError({
        message: "S3 Key is Required",
        statusCode: 400,
      });
    }
    const getURL = await generateGetURL(key);
    if (!getURL) {
      throw new ApiError({
        message: "Unable to generate Get Pre-Signed URL",
        statusCode: 500,
      });
    }
    return res.status(200).json(
      new ApiResponse({
        message: "Successfully Generated The Get Pre-Signed URL",
        statusCode: 200,
        data: {
          getURL,
          key,
        },
      })
    );
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
// improve the business logic by including multiple edge cases and checkpoints for both instructor as well as user. Ensuring secure resourse access.
export const generateMultiGETVideoPreSignedURL = asyncHandler(
  async (req, res) => {
    const { role } = req.info;
    if (role !== "admin") {
      throw new ApiError({
        message: "Unauthorised Request (only admin)",
        statusCode: 401,
      });
    }

    try {
      const { videos } = req.body;
      if (!videos.length) {
        throw new ApiError({
          message: "No Videos Exist in course",
          statusCode: 404,
        });
      }
      const sigendURLs = await Promise.allSettled(
        videos.map(async (video) => {
          const getURL = await generateGetURL(video.s3Key);
          return { getURL, _id: video._id };
        })
      );

      let url = {};

      sigendURLs.forEach((video) => {
        url[video._id] = video.getURL;
      });

      return res.status(200).json(
        new ApiResponse({
          message: "successfully got all the pre-signed urls.",
          statusCode: 200,
          data: url,
        })
      );
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
  }
);

export const deleteS3Items = asyncHandler(async (req, res) => {
  try {
    const { key } = req.query;

    const result = await deleteS3Object(key);
    if (!result) {
      throw new ApiError({
        message: "Unable to Delete S3 Object Try again",
        statusCode: 500,
      });
    }

    return res
      .json(
        new ApiResponse({
          message: "Successfuly Deleted S3 Object",
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
