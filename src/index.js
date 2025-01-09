import dbConnect from "./db/index.js";
import app from "./app.js";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

dbConnect()
  .then(() => {
    app.on("error", (err) => {
      console.log("App Error: ", err);
      process.exit(1);
    });
    app.listen(() => {
      console.log(`Application is Listining At Port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("DB Connection Failed: ", err);
  });
