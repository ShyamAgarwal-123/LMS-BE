import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema({
  url: {
    type: String,
    required: [true, "Video URL is Required"],
  },
  thumbnail: {
    type: String,
    default:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQldv1SEwqRB3Yr6JNklf6cSiRbQC_Bk0pkaQ&s",
  },
  thumbnail_id: {
    type: String,
  },
  title: {
    type: String,
    index: true,
    required: [true, "Video Title is Required"],
    trim: true,
  },

  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],

  notes: [{}],
});

export default Video = mongoose.model("Video", videoSchema);
