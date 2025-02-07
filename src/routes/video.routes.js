import { Router } from "express";
import Auth from "../middlewares/auth.middlewares.js";
import {
  deleteVideoDetails,
  updateVideoDetails,
  uploadVideo,
  uploadVideoDetails,
  videoDelete,
} from "../controllers/video.controllers.js";
import upload from "../middlewares/multer.middlewares.js";
const videoRouter = Router();

videoRouter.use(Auth);

videoRouter.route("/uploadVideo").post(upload.single("file"), uploadVideo);
videoRouter.route("/uploadVideoDetails/:courseId").post(uploadVideoDetails);
videoRouter.route("/updateVideoDetails/:videoId").put(updateVideoDetails);
videoRouter
  .route("/deleteVideoDetails/:courseId/:videoId")
  .delete(deleteVideoDetails);
videoRouter.route("/deleteVideo/:videoId").delete(videoDelete);
videoRouter.route("/deleteVideo").delete(videoDelete);
export default videoRouter;
