import { Router } from "express";
import {
  createCourse,
  getAdminCourses,
  getAllCourses,
  getCourse,
  updateCourse,
} from "../controllers/course.controllers.js";
import Auth from "../middlewares/auth.middlewares.js";
const courseRouter = Router();

courseRouter.route("/allCourses").get(getAllCourses);
courseRouter.use(Auth);
courseRouter.route("/createCourse").post(createCourse);
courseRouter.route("/getAdminCourses").get(getAdminCourses);
courseRouter.route("/getCourse/:courseId").get(getCourse);
courseRouter.route("/updateCourse/:courseId").put(updateCourse);

export default courseRouter;
