import { Router } from "express";
const adminRouter = Router();
import { signup, signin } from "../controllers/admin.controllers.js";

adminRouter.route("/signup").post(signup);
adminRouter.route("/signin").post(signin);

export default adminRouter;
