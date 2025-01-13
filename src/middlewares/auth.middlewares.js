import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export default function Auth(req, res, next) {
  try {
    const token = req.cookies.accessToken;
    if (!token) throw new ApiError({ statusCode: 403, message: "No Token" });
    const verifiedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (!verifiedToken)
      return new ApiError({ statusCode: 401, message: "Invaild Access Token" });
    req.info = { _id: verifiedToken._id };
    next();
  } catch (error) {
    return res.status(error.statusCode || 500).json(
      new ApiResponse({
        statusCode: error.statusCode || 500,
        message: error.message,
      })
    );
  }
}
