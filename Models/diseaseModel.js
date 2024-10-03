const mongoose = require("mongoose");

const diseaseSchema =new mongoose.Schema({
  diseaseId: {
    type: String,
    unique: true,
    default: "DO-1000",
  },
  name: { type: String, required: true },
  diseaseImage: {
    type: String,
    default: null,
  },
  solution: [{
    type: String,
    default: null,
  }],
  prevention: [{
    type: String,
    default: null,
  }],
  products: [{
    type: String,
    default: null,
  }],
  updatedData: [
    {
      updatedBy: { type: String, ref: "Agents" }, // Using agentId instead of ObjectId
      updatedFields: { type: Object },
      updatedAt: { type: Date,default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000) },
      ipAddress: { type: String },  // New field to store IP address
      updatedByEmail:{type:String}
    },
  ],
  LastUpdated_By: {
    type: String, // Use agentId here
    ref: "Agents", // Reference the Agent schema using agentId
  },
});

const Disease = mongoose.model("Disease", diseaseSchema);

module.exports = Disease;