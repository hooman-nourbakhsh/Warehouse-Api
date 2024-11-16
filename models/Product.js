const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
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

module.exports = mongoose.model("Product", productSchema);
