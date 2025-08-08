import Course from "../models/course.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import courseSchema from "../schemas/course.schemas.js";
import User from "../models/user.models.js";
import mongoose from "mongoose";
import { deleteS3Object } from "../utils/s3.js";

export const getAllCourses = asyncHandler(async (req, res) => {
  try {
    const {
      category = "",
      level = "",
      primaryLanguage = "",
      sortBy = "price-lowtohigh",
    } = req.query;
    const filters = {
      isPublished: true,
    };
    if (category.length) {
      filters.category = { $in: category.split(",") };
    }
    if (level.length) {
      filters.level = { $in: level.split(",") };
    }
    if (primaryLanguage.length) {
      filters.primaryLanguage = { $in: primaryLanguage.split(",") };
    }

    let sort = {};
    switch (sortBy) {
      case "price-lowtohigh":
        sort.pricing = 1;
        break;
      case "price-hightolow":
        sort.pricing = -1;
        break;
      case "title-ztoa":
        sort.title = 1;
        break;
      case "title-atoz":
        sort.title = -1;
        break;
      default:
        sort.pricing = 1;
        break;
    }

    console.log(filters);

    const allCourses = await Course.find(filters).sort(sort);
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
    let instructor;
    try {
      instructor = await User.findById(_id);
    } catch (error) {
      throw new ApiError({
        message: "Something Went Wrong While getting The Instructor Details",
        statusCode: 500,
      });
    }
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
      instructorName: instructor?.username,
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
    const { courseId } = req.params;
    if (!courseId)
      throw new ApiError({ message: "CourseId is Required", statusCode: 400 });

    const { url, key } = req.body;
    const course = await Course.findByIdAndUpdate(courseId, {
      thumbnail_s3_key: key,
      thumbnail: url,
    });
    if (!course) {
      throw new ApiError({
        message: "Unable to update Course details",
        statusCode: 500,
      });
    }
    return res.status(200).json(
      new ApiResponse({
        statusCode: 200,
        message: "Course Thumbanil updated successfully",
        data: {
          imageId: course.thumbnail_s3_key,
          image: course.thumbnail,
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

export const deleteCourseThumbnail = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      throw new ApiError({
        message: "courseId is Required",
        statusCode: 400,
      });
    }
    const prevCouse = await Course.findById(courseId);

    const response = await deleteS3Object(prevCouse.thumbnail_s3_key);
    if (!response) {
      throw new ApiError({
        message: "Unable to Delete The Course Thumbnail",
        statusCode: 500,
      });
    }
    const course = await Course.findByIdAndUpdate(courseId, {
      thumbnail:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoeC_2VgaUp-id_Sqlsf0lG1DfmABAF6aTBw&s",
      thumbnail_s3_key: undefined,
    });
    if (!course) {
      throw new ApiError({
        message: "Unable to update Course Details",
        statusCode: 500,
      });
    }
    return res.status(200).json(
      new ApiResponse({
        message: "Successfully Deleted Course Thumbnail",
        statusCode: 200,
        data: {
          image:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoeC_2VgaUp-id_Sqlsf0lG1DfmABAF6aTBw&s",
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
                _id: 1,
                freePreview: 1,
                s3Key: 1,
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

    let course;
    try {
      course = await Course.findById(courseId).populate("videos_id");
    } catch (error) {
      throw new ApiError({
        message: "unable to find course in DB",
        statusCode: 500,
      });
    }
    if (!course) {
      throw new ApiError({
        message: "No Course Found with provided course_id",
        statusCode: 400,
      });
    }
    if (isPublished) {
      // Check if course has any videos at all
      if (!course.videos_id || !course.videos_id.length) {
        throw new ApiError({
          message: "Course must have at least one video to be published",
          statusCode: 400,
        });
      }

      const videos = course.videos_id.filter((video) => video.freePreview);
      if (!videos.length) {
        throw new ApiError({
          message: "At least one uploaded Video Should be Free",
          statusCode: 400,
        });
      }
    }

    course.isPublished = isPublished;
    await course.save({ validateBeforeSave: false });

    return res.status(200).json(
      new ApiResponse({
        message: "Course publish status successfully toggled",
        statusCode: 200,
        data: {
          courseId: course._id,
          isPublished: course.isPublished,
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
