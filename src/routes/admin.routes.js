import { Router } from "express";
const adminRouter = Router();

adminRouter.route("/signup").post();
adminRouter.route("/signin").post();
