var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/login');

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
})




module.exports = mongoose.model("User", userSchema); 