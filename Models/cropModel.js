
const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
  cropId: {
    type: String,
    unique: true,
    default: "CS-01",
  },
  name: { type: String, required: [true, "Name is required"] },
  sowing: Date,
  products_used: [String],
  crop_stage: String,

  image: String, // Image of the crop
  diseases: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Disease",
    },
  ], // Array of diseases related to the crop

  Date: Date,
});

const Crop = mongoose.model("Crop", cropSchema);

module.exports = Crop;