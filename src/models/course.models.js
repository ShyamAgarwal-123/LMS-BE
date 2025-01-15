import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema({
  title: {
    type: String,
    index: true,
    required: [true, "Course Title is Required"],
    trim: true,
  },
  subtitle: {
    type: String,
    required: [true, "Course Subtitle is Required"],
    trim: true,
  },
  discription: {
    type: String,
    required: [true, "Course Discription is Required"],
  },
  price: {
    type: Number,
    required: [true, "Price is Required"],
  },
  thumbnail: {
    type: String,
    default:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoeC_2VgaUp-id_Sqlsf0lG1DfmABAF6aTBw&s",
  },
  thumbnail_id: {
    type: String,
  },
  videos_id: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
  isPublished: {
    type: Boolean,
    default: false,
  },
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
