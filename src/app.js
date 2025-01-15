import express from "express";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ limit: "16kb", extended: "true" }));
app.use("/static", express.static("public"));

import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import courseRouter from "./routes/course.routes.js";

app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);
export default app;
