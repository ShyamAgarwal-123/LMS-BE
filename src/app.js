import express from "express";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ limit: "16kb", extended: "true" }));
app.use("static", express.static("public"));

export default app;
