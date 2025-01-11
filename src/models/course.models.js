import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema({
  title: {
    type: String,
    index: true,
    required: [true, "Course Title is Required"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price is Required"],
  },
  image: {
    type: String,
    default:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoeC_2VgaUp-id_Sqlsf0lG1DfmABAF6aTBw&s",
  },
  video: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
});

export default Course = mongoose.model("Course", courseSchema);
