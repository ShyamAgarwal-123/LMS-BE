import express from "express";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ limit: "16kb", extended: "true" }));
app.use("/static", express.static("public"));

import userRouter from "./routes/user.routes.js";

// app.use("/api/v1/admins",);
app.use("/api/v1/users", userRouter);
export default app;
