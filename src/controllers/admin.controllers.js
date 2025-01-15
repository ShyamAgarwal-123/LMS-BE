import Admin from "../models/admin.model.js";
import signUpSchema from "../schemas/signin.schemas.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import signInSchema from "../schemas/signup.schemas.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";

export const signup = asyncHandler(async (req, res) => {
  try {
    const { adminname, email, password } = req.body;
    const validatedInput = signUpSchema.safeParse({
      username: adminname,
      email,
      password,
    });
    if (!validatedInput.success)
      throw new ApiError({ statusCode: 400, message: validatedInput.error });
    const existedAdmin = await Admin.findOne({ adminname });
    if (existedAdmin)
      throw new ApiError({ statusCode: 409, message: "Admin Already Exit" });
    const newAdmin = await Admin.create({
      adminname,
      password,
      email,
    });
    if (!newAdmin)
      throw new ApiError({
        message: "Unable To Signup Admin",
        statusCode: 501,
      });

    return res.status(201).json(
      new ApiResponse({
        statusCode: 201,
        message: "Admin SignUp Successfully",
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
    const { adminname, password } = req.body;
    const validatedInput = signInSchema.safeParse({
      username: adminname,
      password,
    });
    if (!validatedInput.success)
      throw new ApiError({ statusCode: 400, message: validatedInput.error });
    const existedAdmin = await Admin.findOne({ adminname });
    if (!existedAdmin)
      throw new ApiError({
        statusCode: 400,
        message: "Admin Does not Exist with such adminname",
      });
    if (!(await existedAdmin.isPasswordCorrect(password)))
      throw new ApiError({ message: "Incorrect Password", statusCode: 400 });
    const accessToken = generateAccessToken(res, existedAdmin);
    const refreshToken = await generateRefreshToken(res, existedAdmin);
    const cookieOption = {
      httpOnly: true,
      maxAge: 300000,
    };
    return res
      .cookie("refreshToken", refreshToken, cookieOption)
      .cookie("accessToken", accessToken, cookieOption)
      .status(200)
      .json({
        statusCode: 200,
        data: {
          refreshToken,
          accessToken,
        },
        message: "Admin is Successfully Signed In",
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

    const existUser = await Admin.findById(verifiedToken._id);

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
