const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"] },
  sowing: Date,
  products_used: [String],
  crop_stage: String,
});

const Crop = mongoose.model("Crop", cropSchema);

module.exports = Crop;
