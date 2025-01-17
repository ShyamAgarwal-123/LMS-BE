import { Router } from "express";
import { getAllCourses } from "../controllers/course.controllers.js";
const courseRouter = Router();

courseRouter.route("/allCourses").get(getAllCourses);

export default courseRouter;
