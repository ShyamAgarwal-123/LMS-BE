import Course from "../models/course.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import courseSchema from "../schemas/course.schemas.js";
import { uploadImageOnCloudinary } from "../utils/cloudinary.js";
import User from "../models/user.models.js";

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
      isPublished,
    });
    if (!validatedInputs.success)
      throw new ApiError({ message: validatedInputs.error, statusCode: 400 });
    const course = await Course.create({
      title,
      subtitle,
      price,
      discription,
      isPublished,
    });
    if (!course)
      throw new ApiError({
        message: "Unable to Create Course",
        statusCode: 500,
      });

    await User.findByIdAndUpdate(_id, {
      $push: { courses: course._id },
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

export const uploadCourseThumbnail = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.info;
    if (!_id)
      throw new ApiError({ statusCode: 403, message: "Unauthorized Access" });
    const { courseId } = req.params;
    if (!courseId)
      throw new ApiError({ message: "CourseId is Required", statusCode: 400 });
    const course = Course.findById(courseId);
    if (!course)
      throw new ApiError({
        message: "Unable to Fetch Course form DB",
        statusCode: 500,
      });
    const { path } = req.file;
    if (!path)
      throw new ApiError({
        message: "Course Thumbnail is Required",
        statusCode: 400,
      });
    if (course.thumbnail_id) {
      const response = await deleteImageFromCloudinary(course.thumbnail_id);
      if (!response) {
        fs.unlinkSync(path);
        throw new ApiError({
          message: "Unable to Delete The Previous Course Thumbnail",
          statusCode: 500,
        });
      }
    }
    const generated_public_id = courseId + "/" + Date.now();
    const { public_id, url } = await uploadImageOnCloudinary(
      path,
      `Courses/CourseThumbnail/${courseId}`,
      generated_public_id
    );
    if (!public_id && !url)
      throw new ApiError({
        message: "Unable To Upload the Upload The Course Tumbnail",
        statusCode: 500,
      });
    course.thumbnail_id = public_id;
    course.thumbnail = url;
    course.save({ validateBeforeSave: false });
    return res.status(200).json(
      new ApiResponse({
        statusCode: 200,
        message: "Course Thumbanil updated successfully",
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
