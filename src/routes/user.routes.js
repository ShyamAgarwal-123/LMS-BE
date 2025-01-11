import { Router } from "express";
import { signup } from "../controllers/user.controllers.js";
const userRouter = Router();

userRouter.route("/signup").post(signup);
// userRouter.route("/signin").post();

export default userRouter;
