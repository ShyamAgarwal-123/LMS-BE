import { Router } from "express";
import Auth from "../middlewares/auth.middlewares.js";
import { uploadVideo } from "../controllers/video.controllers.js";
import upload from "../middlewares/multer.middlewares.js";
const videoRouter = Router();

videoRouter.use(Auth);

videoRouter
  .route("/uploadVideo/:courseId")
  .post(upload.single("file"), uploadVideo);

export default videoRouter;
