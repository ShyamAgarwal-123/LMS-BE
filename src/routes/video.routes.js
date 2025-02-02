import { Router } from "express";
import Auth from "../middlewares/auth.middlewares.js";
import {
  deleteVideoDetails,
  updateVideoDetails,
  uploadVideo,
  uploadVideoDetails,
} from "../controllers/video.controllers.js";
import upload from "../middlewares/multer.middlewares.js";
const videoRouter = Router();

videoRouter.use(Auth);

videoRouter
  .route("/uploadVideo/:courseId")
  .post(upload.single("file"), uploadVideo);
videoRouter
  .route("/uploadVideo/:courseId/:videoId")
  .post(upload.single("file"), uploadVideo);

videoRouter.route("/uploadVideoDetails/:courseId").post(uploadVideoDetails);
videoRouter.route("/updateVideoDetails/:videoId").put(updateVideoDetails);
videoRouter
  .route("/deleteVideoDetails/:courseId/:videoId")
  .delete(deleteVideoDetails);

export default videoRouter;
