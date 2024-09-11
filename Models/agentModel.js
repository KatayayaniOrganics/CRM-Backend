
const mongoose = require('mongoose');
const UserRoles = require("../Models/userRolesModel")

const agentSchema = new mongoose.Schema({
    agentId:{
      type: String,
      unique:true,
      default:"A0-1000",
    },
  firstname: {
    type: String,
    required: [true, "First Name is required"],
    trim: true,
    minLength: [3, "First Name should be at least 3 characters long"]
  },
  lastname: {
    type: String,
    required: [true, "Last Name is required"],
    trim: true,
    minLength: [3, "Last Name should be at least 3 characters long"]
  },
  email: {
    type: String,
    required:[true,"Email Address is Required"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address"
    ],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minLength: [6, 'Password should have at least 6 characters']
  },
  address: {
    type: String,
    required: [true, "Address is required"]
  },
  user_role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserRoles",
  },
  otp: String,
    otpExpirationTime: Date,
    otpVerified: {
        type: Boolean,
        default: false,
    },
  call_history: [
    {
      call_id: { type: mongoose.Schema.Types.ObjectId, ref: "CallDetails" }
    }
  ],
  talktime_day: Number,
  total_talktime: Number,
  breaktime_day: Number,
  total_breaktime: Number,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshToken: {
    type: String,
    default: null
  }
  
});

const Agent = mongoose.model("Agents", agentSchema);
module.exports = Agent;
