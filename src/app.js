import express from "express";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ limit: "16kb", extended: "true" }));
app.use("/static", express.static("public"));

import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";

app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/users", userRouter);
export default app;
