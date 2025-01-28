import Course from "../models/course.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import courseSchema from "../schemas/course.schemas.js";
import { uploadImageOnCloudinary } from "../utils/cloudinary.js";
import User from "../models/user.models.js";
import mongoose from "mongoose";

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
      throw new ApiError({ statusCode: 403, message: "user info missing" });
    let {
      title,
      subtitle,
      pricing,
      description,
      isPublished = false,
      category,
      level,
      primaryLanguage,
      objectives,
      welcomeMessage,
    } = req.body;
    pricing = JSON.parse(pricing);
    const validatedInputs = courseSchema.safeParse({
      title,
      subtitle,
      pricing,
      description,
      isPublished,
      category,
      level,
      primaryLanguage,
      objectives,
      welcomeMessage,
    });
    if (!validatedInputs.success)
      throw new ApiError({
        message: validatedInputs.error?.issues?.[0]?.message,
        path: validatedInputs.error?.issues?.[0]?.path?.[0],
        statusCode: 400,
      });
    const course = await Course.create({
      title,
      subtitle,
      pricing,
      description,
      isPublished,
      category,
      level,
      primaryLanguage,
      objectives,
      welcomeMessage,
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
        path: error.path,
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

export const getAdminCourses = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.info;
    if (!_id)
      throw new ApiError({ statusCode: 403, message: "user info missing" });
    const courses = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(_id),
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courses",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "courses",
                as: "students",
              },
            },
            {
              $project: {
                _id: 1,
                pricing: 1,
                title: 1,
                students: {
                  $max: [{ $subtract: [{ $size: "$students" }, 1] }, 0],
                },
                revenue: {
                  $multiply: [
                    { $max: [{ $subtract: [{ $size: "$students" }, 1] }, 0] }, // Adjusted student count
                    "$pricing",
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          courses: 1,
        },
      },
    ]);

    if (!courses) {
      throw new ApiError({
        message: "Unable to get the Required Courses from db",
        statusCode: 500,
      });
    }
    return res.status(200).json(
      new ApiResponse({
        message: "Successfully got the requested Courses",
        statusCode: 200,
        data: courses[0]?.courses,
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

export const getCourse = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      throw new ApiError({ message: "Course Id is Required", statusCode: 400 });
    }
    const [course] = await Course.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos_id",
          foreignField: "_id",
          as: "videos",
          pipeline: [
            {
              $project: {
                title: 1,
                videoUrl: 1,
                _id: 1,
                freePreview: 1,
              },
            },
          ],
        },
      },
    ]);
    if (!course) {
      throw new ApiError({
        message: "Unable to get the Required Course from db",
        statusCode: 500,
      });
    }
    return res.status(200).json(
      new ApiResponse({
        message: "Successfully got the requested Course",
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

export const updateCourse = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId) {
      throw new ApiError({ message: "Course Id is Required", statusCode: 400 });
    }

    let newCourseData = req.body;
    newCourseData.pricing = JSON.parse(newCourseData?.pricing);
    const validatedInputs = courseSchema.safeParse(newCourseData);
    if (!validatedInputs.success)
      throw new ApiError({
        message: validatedInputs.error?.issues?.[0]?.message,
        path: validatedInputs.error?.issues?.[0]?.path?.[0],
        statusCode: 400,
      });
    const updateCourse = await Course.findByIdAndUpdate(
      courseId,
      newCourseData
    ).select("-_id -thumbnail -videos_id -isPublished -__v");
    if (!updateCourse) {
      throw new ApiError({
        message: "Unable to Update The Course by DB",
        statusCode: 500,
      });
    }
    return res.status(200).json(
      new ApiResponse({
        message: "Successfully Updated The Data",
        statusCode: 200,
        data: updateCourse,
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

export const togglePublish = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId) {
      throw new ApiError({ message: "Course Id is Required", statusCode: 400 });
    }
    const { isPublished } = req.body;
    if (isPublished !== false && isPublished !== true) {
      throw new ApiError({
        message: "isPublished is required",
        statusCode: 400,
      });
    }
    let updateCourse;
    try {
      updateCourse = await Course.findByIdAndUpdate(courseId, {
        isPublished,
      });
    } catch (error) {
      throw new ApiError({
        message: "Unable to toggle isPublished by DB",
        statusCode: 500,
      });
    }
    return res.status(200).json(
      new ApiResponse({
        message: "isPublished Successfully is Toggled",
        statusCode: 200,
        data: updateCourse,
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
