import { Router } from "express";
import Auth from "../middlewares/auth.middlewares.js";
import {
  updateVideoDetails,
  uploadS3VideoDetails,
  deleteVideoDetails,
} from "../controllers/video.controllers.js";
const videoRouter = Router();

videoRouter.use(Auth);
videoRouter.route("/updateVideoDetails/:videoId").put(updateVideoDetails);
videoRouter
  .route("/deleteVideoDetails/:courseId/:videoId")
  .delete(deleteVideoDetails);
videoRouter.route("/uploadVideoDetails/:courseId").post(uploadS3VideoDetails);
export default videoRouter;
