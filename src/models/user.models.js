import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is Required"],
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is Required"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is Required"],
    },
    purchasedCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    profileImage: {
      type: String,
      default:
        "https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg",
    },
    profileImage_id: {
      type: String,
    },
    coverImage: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyQGf3A22wgLiZ-cxPzCfFmaI2WEtv9JMaLA&s",
    },
    coverImage_id: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.method.isPasswordCoreect = async (password) => {
  return await bcrypt.compare(password, this.password);
};

userSchema.method.generateAccessToken = () => {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      algorithm: "ES256",
      expiresIn: "10min",
    }
  );
};

userSchema.method.generateRefreshToken = () => {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "1day",
    }
  );
};

const User = mongoose.model("User", userSchema);

export default User;
