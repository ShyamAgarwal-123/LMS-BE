import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  comment: {
    type: String,
  },

  nestedComment: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
});

export default Comment = mongoose.model("Comment", commentSchema);
