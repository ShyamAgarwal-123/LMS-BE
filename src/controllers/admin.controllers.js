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
    const { username, email, password } = req.body;
    const validatedInput = signUpSchema.safeParse({
      username,
      email,
      password,
    });
    if (!validatedInput.success)
      throw new ApiError({
        statusCode: 400,
        message: validatedInput.error?.issues?.[0]?.message,
        path: validatedInput.error?.issues?.[0]?.path?.[0],
      });
    const existedAdmin = await Admin.findOne({ username });
    if (existedAdmin)
      throw new ApiError({ statusCode: 409, message: "Admin Already Exit" });
    const newAdmin = await Admin.create({
      username,
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
    return res.status(error.statusCode || 500 || error.http_code).json(
      new ApiResponse({
        message: error.message,
        path: error.path,
        statusCode: error.statusCode || 500 || error.http_code,
      })
    );
  }
});

export const signin = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const validatedInput = signInSchema.safeParse({
      email,
      password,
    });
    if (!validatedInput.success)
      throw new ApiError({
        statusCode: 400,
        message: validatedInput.error?.issues?.[0]?.message,
        path: validatedInput.error?.issues?.[0]?.path?.[0],
      });
    const existedAdmin = await Admin.findOne({ email });
    if (!existedAdmin)
      throw new ApiError({
        statusCode: 400,
        message: "Admin Does not Exist with such email",
      });
    if (!(await existedAdmin.isPasswordCorrect(password)))
      throw new ApiError({ message: "Incorrect Password", statusCode: 400 });
    const accessToken = generateAccessToken(res, existedAdmin);
    const refreshToken = await generateRefreshToken(res, existedAdmin);
    const cookieOption = {
      httpOnly: true,
      maxAge: 300000,
      secure: true,
      sameSite: "none",
    };
    return res
      .cookie("refreshToken", refreshToken, cookieOption)
      .cookie("accessToken", accessToken, cookieOption)
      .status(200)
      .json({
        statusCode: 200,
        data: existedAdmin,
        message: "Admin is Successfully Signed In",
      });
  } catch (error) {
    return res.status(error.statusCode || 500 || error.http_code).json(
      new ApiResponse({
        message: error.message,
        path: error.path,
        statusCode: error.statusCode || 500 || error.http_code,
      })
    );
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
