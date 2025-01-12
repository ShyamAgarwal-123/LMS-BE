import User from "../models/user.models.js";
import signUpSchema from "../schemas/signin.schemas.js";
import signInSchema from "../schemas/signup.schemas.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";

const signup = asyncHandler(async (req, res) => {
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

const signin = asyncHandler(async (req, res) => {
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
    return res.status(200).json({
      statusCode: 200,
      data: {
        refreshToken,
        accessToken,
      },
      message: "User is Successfully Signed In",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
      statusCode: error.statusCode || 500,
    });
  }
});

const editProfileImage = asyncHandler(async (req, res, next) => {
  const { _id } = req.info;
  console.log(req);
  if (!_id)
    throw new ApiError({ statusCode: 403, message: "Unauthorized Access" });
  const user = User.findById(_id);

  res.json({ h: "hi" });
});
export { signup, signin, editProfileImage };
