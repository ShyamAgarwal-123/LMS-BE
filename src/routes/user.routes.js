import { Router } from "express";
import upload from "../middlewares/multer.middlewares.js";
import Auth from "../middlewares/auth.middlewares.js";
import {
  editProfileImage,
  signin,
  signup,
} from "../controllers/user.controllers.js";
const userRouter = Router();

userRouter.route("/signup").post(signup);
userRouter.route("/signin").post(signin);

userRouter.use(Auth);

userRouter
  .route("/profileImage")
  .put(upload.single("profileImage"), editProfileImage);

export default userRouter;
