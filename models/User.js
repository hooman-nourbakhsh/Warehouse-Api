const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        const { _id } = ret;
        return {
          id: _id.toString(), // Convert ObjectId to string
          ...ret,
        };
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
