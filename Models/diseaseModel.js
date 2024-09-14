const mongoose = require("mongoose");

const diseaseSchema = new mongoose.Schema({
  diseaseName: { type: String, required: true }, 
  diseaseImage: {
    type:String,
    default:null
  },
  solution: [{
    type:String,
    default:null
  }], 
  prevention: [{
    type:String,
    default:null
  }], 
  products: [{
    type:String,
    default:null
  }], 
});

const Disease = mongoose.model("Disease", diseaseSchema);

module.exports = Disease;
