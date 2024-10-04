
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
  updatedData: [
    {
      updatedBy: { type: String, ref: "Agents" }, // Using agentId instead of ObjectId
      updatedFields: { type: Object },
      updatedAt: { type: Date, default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000) },
      ipAddress: { type: String },  // New field to store IP address
      updatedByEmail: { type: String }
    },
  ],
  LastUpdated_By: {
    type: String, // Use agentId here
    ref: "Agents", // Reference the Agent schema using agentId
  },
});

const Crop = mongoose.model("Crop", cropSchema);

module.exports = Crop;