const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  agentId:{
    type: String,
    unique:true,
    default:"A0-1000",
  },
  firstname: {
    type: String,
    trim: true,
    required: [true, "First Name is required"],
    minLength: [3, "First Name should be at least 3 characters long"]
  },
  lastname: {
    type: String,
    trim: true,
    required: [true, "Last Name is required"],
    minLength: [3, "Last Name should be at least 3 characters long"]
  },
  email: {
    type: String,
    required:[true,"Email Address is Required"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address"
    ],
  },
  contact:{
    countryCode:{type:String,default:null},
    phoneNumber:{type:Number,default:null},
  },
  state:{type:String,default:null},
  city:{type:String,default:null},
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
    type: String,
    default:"USR-1002",
    ref: "UserRoles" // Reference the UserRoles schema
  },
  otp: String,
  otpExpirationTime: Date,
  otpVerified: {
    type: Boolean,
    default: false,
  },
  call_history: [
    {
      call_id: { type: mongoose.Schema.Types.ObjectId, ref: "Calls" }
    }
  ],
  updated_By:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Agents"
  },
  talktime_day:{type:Number,default:null},
  total_talktime: {type:Number,default:null},
  breaktime_day: {type:Number,default:null},
  total_breaktime: {type:Number,default:null},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshToken: {
    type: String,
    default: null
  }
  
});

const Agents = mongoose.model("Agents", agentSchema);
module.exports = Agents;
