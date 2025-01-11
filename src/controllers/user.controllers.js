import User from "../models/user.models.js";
import { signUpSchema } from "../schemas/signin.schemas.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

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

export { signup };
