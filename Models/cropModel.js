
const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
  cropId: {
    type: String,
    unique: true,
    default: "CS-01",
  },
  name: { 
    type: String, 
    required: [true, "Name is required"] 
  },
  sowing: {
    type: Date,
    default: null
  },
  products_used: [{
    type: String,
    default: null
  }],
  cropImage: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  stages: [
    {
      name: {
        type: String,
        default: null
      },
      stage: {
        type: String,
        default: null
      },
      duration: {
        type: String,
        default: null
      },
      diseases: [
        {
          type: String, 
          ref: 'Disease'
        }
      ],
    }
  ],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agents',
  },
});

const Crop = mongoose.model("Crop", cropSchema);

module.exports = Crop;
