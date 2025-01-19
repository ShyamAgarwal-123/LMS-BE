import { Router } from "express";
import upload from "../middlewares/multer.middlewares.js";
import Auth from "../middlewares/auth.middlewares.js";
import {
  editCoverImage,
  editProfileImage,
  getUser,
  refreshAccessToken,
  signin,
  signup,
} from "../controllers/user.controllers.js";
const userRouter = Router();

userRouter.route("/signup").post(signup);
userRouter.route("/signin").post(signin);
userRouter.route("/refreshAccessToken").post(refreshAccessToken);

userRouter.use(Auth);

userRouter.route("/getUser").get(getUser);
userRouter
  .route("/profileImage")
  .put(upload.single("profileImage"), editProfileImage);

userRouter
  .route("/coverImage")
  .put(upload.single("coverImage"), editCoverImage);
export default userRouter;
