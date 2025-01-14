import User from "../models/user.models.js";
import jwt from "jsonwebtoken";
import signUpSchema from "../schemas/signin.schemas.js";
import signInSchema from "../schemas/signup.schemas.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteImageFromCloudinary,
  uploadImageOnCloudinary,
} from "../utils/cloudinary.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import fs from "fs";

export const signup = asyncHandler(async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const validatedInput = signUpSchema.safeParse({
      username,
      email,
      password,
    });
    if (!validatedInput.success)
      throw new ApiError({ statusCode: 400, message: validatedInput.error });
    const existedUser = await User.findOne({ username });
    if (existedUser)
      throw new ApiError({ statusCode: 409, message: "User Already Exit" });
    const newUser = await User.create({
      username,
      password,
      email,
    });
    if (!newUser)
      throw new ApiError({ message: "Unable To Signup User", statusCode: 501 });

    return res.status(201).json(
      new ApiResponse({
        statusCode: 201,
        message: "User SignUp Successfully",
      })
    );
  } catch (error) {
    return res.status(error.statusCode || 500).json(
      new ApiResponse({
        message: error.message,
        statusCode: error.statusCode || 500,
      })
    );
  }
});

export const signin = asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;
    const validatedInput = signInSchema.safeParse({ username, password });
    if (!validatedInput.success)
      throw new ApiError({ statusCode: 400, message: validatedInput.error });
    const existUser = await User.findOne({ username });
    if (!existUser)
      throw new ApiError({
        statusCode: 400,
        message: "User Does not Exist with such username",
      });

    if (!(await existUser.isPasswordCorrect(password)))
      throw new ApiError({ message: "Incorrect Password", statusCode: 400 });
    const accessToken = generateAccessToken(res, existUser);
    const refreshToken = await generateRefreshToken(res, existUser);
    const cookieOption = {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    };
    return res
      .cookie("refreshToken", refreshToken, cookieOption)
      .cookie("accessToken", accessToken, cookieOption)
      .status(200)
      .json({
        statusCode: 201,
        message: "User is Successfully Signed In",
      });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
      statusCode: error.statusCode || 500,
    });
  }
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken)
      throw new ApiError({
        message: "Unauthorised Request",
        statusCode: 403,
      });
    const verifiedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    if (!verifiedToken)
      throw new ApiError({ statusCode: 401, message: "Invaild Refresh Token" });

    const existUser = await User.findById(verifiedToken._id);

    const accessToken = generateAccessToken(res, existUser);
    const cookieOption = {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    };
    return res
      .cookie("accessToken", accessToken, cookieOption)
      .status(201)
      .json(
        new ApiResponse({
          statusCode: 201,
          message: "Access Token is Successfully Refreshed",
        })
      );
  } catch (error) {
    res.status(error.statusCode || error.http_code || 500).json(
      new ApiResponse({
        message: error.message,
        statusCode: error.statusCode || error.http_code || 500,
      })
    );
  }
});

export const editProfileImage = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.info;
    if (!_id)
      throw new ApiError({ statusCode: 403, message: "Unauthorized Access" });

    const path = req.file?.path;
    if (!path)
      throw new ApiError({ message: "Invalid File Type", statusCode: 400 });

    const user = await User.findById(_id);
    if (user.profileImage_id) {
      const response = await deleteImageFromCloudinary(user.profileImage_id);
      if (!response) {
        fs.unlinkSync(path);
        throw new ApiError({
          message: "Unable to Upload The Profile Image",
          statusCode: 500,
        });
      }
    }
    const generated_public_id = _id + "/" + Date.now();
    const { public_id, url } = await uploadImageOnCloudinary(
      path,
      "user/ProfileImage",
      generated_public_id
    );
    if (!public_id && !url)
      throw new ApiError({
        message: "Unable To Upload the Profile Image",
        statusCode: 500,
      });
    user.profileImage_id = public_id;
    user.profileImage = url;
    user.save({ validateBeforeSave: false });
    return res.status(200).json(
      new ApiResponse({
        statusCode: 200,
        message: "Profile image updated successfully",
      })
    );
  } catch (error) {
    return res.status(error.statusCode || 500).json(
      new ApiResponse({
        message: error.message,
        statusCode: error.statusCode || 500,
      })
    );
  }
});

export const editCoverImage = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.info;
    if (!_id)
      throw new ApiError({ statusCode: 403, message: "Unauthorized Access" });

    const path = req.file?.path;
    if (!path)
      throw new ApiError({ message: "Invalid File Type", statusCode: 400 });

    const user = await User.findById(_id);
    if (user.coverImage_id) {
      const response = await deleteImageFromCloudinary(user.coverImage_id);
      if (!response) {
        fs.unlinkSync(path);
        throw new ApiError({
          message: "Unable to Upload The Cover Image",
          statusCode: 500,
        });
      }
    }
    const generated_public_id = _id + "/" + Date.now();
    const { public_id, url } = await uploadImageOnCloudinary(
      path,
      "user/CoverImage",
      generated_public_id
    );
    if (!public_id && !url)
      throw new ApiError({
        message: "Unable To Upload the Cover Image",
        statusCode: 500,
      });
    user.coverImage_id = public_id;
    user.coverImage = url;
    user.save({ validateBeforeSave: false });

    return res.status(200).json(
      new ApiResponse({
        statusCode: 200,
        message: "Cover image updated successfully",
      })
    );
  } catch (error) {
    return res.status(error.statusCode || 500).json(
      new ApiResponse({
        message: error.message,
        statusCode: error.statusCode || 500,
      })
    );
  }
});
