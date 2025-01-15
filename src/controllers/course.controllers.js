import Course from "../models/course.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import courseSchema from "../schemas/course.schemas.js";
import { uploadImageOnCloudinary } from "../utils/cloudinary.js";

export const getAllCourses = asyncHandler(async (req, res, next) => {
  try {
    const allCourses = await Course.find({ isPublished: true });
    if (!allCourses)
      throw new ApiError({ message: "Unable to Get Courses", statusCode: 500 });
    if (!allCourses.length)
      throw new ApiError({ message: "No Course Found", statusCode: 404 });
    return res.status(200).json(
      new ApiResponse({
        data: allCourses,
        statusCode: 200,
        message: "Successfully got all the Courses",
      })
    );
  } catch (error) {
    return res.status(error.statusCode || error.http_code || 500).json(
      new ApiResponse({
        statusCode: error.statusCode || error.http_code || 500,
        message: error.message,
      })
    );
  }
});

export const createCourse = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.info;
    if (!_id)
      throw new ApiError({ statusCode: 403, message: "Unauthorized Access" });
    const {
      title,
      subtitle,
      price,
      discription,
      isPublished = false,
    } = req.body;
    const validatedInputs = courseSchema.safeParse({
      title,
      subtitle,
      price,
      discription,
    });
    if (!validatedInputs.success)
      throw new ApiError({ message: validatedInputs.error, statusCode: 400 });
    const { path } = req.file;
    if (!path)
      throw new ApiError({ message: "Thumbnail is Required", statusCode: 400 });

    const generated_public_id = _id + "/" + Date.now();
    const { public_id, url } = await uploadImageOnCloudinary(
      path,
      "courses/Tumbnail",
      generated_public_id
    );
    if (!public_id && !url)
      throw new ApiError({
        message: "Unable To Upload the Upload The Tumbnail",
        statusCode: 500,
      });

    const course = await Course.create({
      title,
      subtitle,
      price,
      discription,
      thumbnail: url,
      thumbnail_id: public_id,
      isPublished,
    });
    if (!course)
      throw new ApiError({
        message: "Unable to Create Course",
        statusCode: 500,
      });
    return res.status(200).json(
      new ApiResponse({
        message: "Course Created Successfully",
        statusCode: 200,
        data: course,
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
