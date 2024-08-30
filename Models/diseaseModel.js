const mongoose = require("mongoose");

const diseaseSchema = new mongoose.Schema({
    diseaseName: { type: String, required: true }, // Disease name
    diseaseImage: String, // Image of the disease
    symptoms: [String], // Array of symptoms
    prevention: [String], // Array of prevention methods
    products: [String], // Array of products used for treatment
  });
  


const Disease = mongoose.model("Disease", diseaseSchema);

module.exports = Disease;
