import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbConnect = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DB_URI}/${DB_NAME}`
    );
    console.log(`\nDB Connected , HOST:${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("DB Connection Failed: ", error);
    process.exit(1);
  }
};

export default dbConnect;
