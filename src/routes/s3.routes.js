import { Router } from "express";
import {
  generatePUTPreSignedURL,
  generateGETVideoPreSignedURL,
  generateMultiGETVideoPreSignedURL,
  deleteS3Items,
  getPublicURL,
} from "../controllers/s3.controllers.js";
import Auth from "../middlewares/auth.middlewares.js";

const s3Router = Router();

s3Router.route("/upload-url").get(Auth, generatePUTPreSignedURL);
s3Router.route("/get-url").get(Auth, generateGETVideoPreSignedURL);
s3Router.route("/public-url").get(Auth, getPublicURL);
s3Router.route("/multi-get-url").post(Auth, generateMultiGETVideoPreSignedURL);
s3Router.route("/delete").delete(Auth, deleteS3Items);

export default s3Router;
