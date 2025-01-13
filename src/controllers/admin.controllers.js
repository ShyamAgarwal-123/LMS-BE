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

const signup = asyncHandler(async (req, res) => {
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

const signin = asyncHandler(async (req, res) => {
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

export { signup, signin };
